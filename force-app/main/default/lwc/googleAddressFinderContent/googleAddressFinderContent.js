import { LightningElement, wire, api, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import getAddresses from '@salesforce/apex/GoogleAddressFinderController.getAddresses';
import getAddressDetails from '@salesforce/apex/GoogleAddressFinderController.getAddressDetails';

export default class GoogleAddressFinderContent extends LightningElement {
  @api parent;
  @api address;

  _recordData;

  @track searchedResults = [];
  loadingAddresses = false;
  noRecordsFound = false;
  errorFromAPI = false;

  finishLoaded = false;
  showSpinner = false;
  isNotChanged = true;
  editing = false;
  searchText = '';
  error;
  currentLocationError;
  mapMarkers;

  _sessionToken;
  _street;
  _suburb;
  _state;
  _country;
  _placeId;
  _latitude;
  _longitude;
  _city;
  _postalCode;
  _addressFound = false;
  _timerId;

  // =======================================================================================================================================================================================================================================
  // lifecycle methods
  // =======================================================================================================================================================================================================================================
  connectedCallback() {
    window.addEventListener('click', () => {
      this.searchedResults = [];
    });

    // if it's in flow then it's ready
    if (this.isInFlow) {
      this.finishLoaded = true;

      // build the map markers
      this._buildMapMarkers();
    }

    this._sessionToken = this._generateSessionToken();
  }

  disconnectedCallback() {
    window.removeEventListener('click', () => {
      this.searchedResults = [];
    });
  }

  renderedCallback() {
    // add the max height for the map in the flow
    if (this.showMapInFlow) {
      const style = document.createElement('style');
      style.innerText = `.editMap .slds-map { max-height: 400px !important;}`;
      this.template.querySelector('lightning-map').appendChild(style);
    }
  }

  // =======================================================================================================================================================================================================================================
  // wire methods
  // =======================================================================================================================================================================================================================================
  @wire(getRecord, { recordId: '$parent.recordId', fields: '$fields' })
  getMainRecordData(result) {
    this.wiredResult = result;
    if (result.data) {
      this._recordData = result.data;
      this.error = undefined;

      // build the map markers
      if (!this.isEditing) {
        this._buildMapMarkers();
      }
    } else if (result.error) {
      this.error = `Error getting main record data - ${this._reduceErrors(result.error)}`;
    }
  }

  // =======================================================================================================================================================================================================================================
  // getter methods
  // =======================================================================================================================================================================================================================================
  get isReadyToRender() {
    if (this.isInFlow) {
      return true;
    }

    return this._recordData;
  }

  get street() {
    if (this.isInFlow) {
      return this._street || this.parent.streetInput || '';
    }

    let streetToReturn =
      this._street || getFieldValue(this._recordData, `${this.parent.objectApiName}.${this.streetField}`);

    // if we have a suburb then add it as part of the street to display
    if (!this.suburbField && this.suburb) {
      streetToReturn += `, ${this.suburb}`;
    }

    return streetToReturn;
  }

  get streetToShow() {
    if (this.suburbField && this.stateField) {
      return `${this.street}, ${this.suburb}`;
    }

    return this.street;
  }

  get suburb() {
    if (this.isInFlow) {
      return this._suburb || this.parent.suburbInput || '';
    }

    return this._suburb || getFieldValue(this._recordData, `${this.parent.objectApiName}.${this.suburbField}`);
  }

  get state() {
    if (this.isInFlow) {
      return this._state || this.parent.stateInput || '';
    }

    return this._state || getFieldValue(this._recordData, `${this.parent.objectApiName}.${this.stateField}`);
  }

  get stateToShow() {
    // if we don't have a state, then city is state, and the suburb is the city
    if (!this.stateField && this.suburbField) {
      return this.city;
    }

    return this.state;
  }

  get country() {
    if (this.isInFlow) {
      return this._country || this.parent.countryInput || '';
    }

    return this._country || getFieldValue(this._recordData, `${this.parent.objectApiName}.${this.countryField}`);
  }

  get city() {
    if (this.isInFlow) {
      return this._city || this.parent.cityInput || '';
    }

    return this._city || getFieldValue(this._recordData, `${this.parent.objectApiName}.${this.cityField}`);
  }

  get cityToShow() {
    // if we don't have a state, then city is state, and the suburb is the city
    if (!this.stateField && this.suburbField) {
      return this.suburb;
    }

    return this.city;
  }

  get postalCode() {
    if (this.isInFlow) {
      return this._postalCode || this.parent.postalCodeInput || '';
    }

    return this._postalCode || getFieldValue(this._recordData, `${this.parent.objectApiName}.${this.postalCodeField}`);
  }

  get placeId() {
    if (this.isInFlow) {
      return this._placeId || this.parent.placeIdInput || '';
    }

    return this._placeId || getFieldValue(this._recordData, `${this.parent.objectApiName}.${this.placeIdField}`) || '';
  }

  get latitude() {
    if (this.isInFlow) {
      return this._latitude || this.parent.latitudeInput || '';
    }

    return (
      this._latitude || getFieldValue(this._recordData, `${this.parent.objectApiName}.${this.latitudeField}`) || ''
    );
  }

  get longitude() {
    if (this.isInFlow) {
      return this._longitude || this.parent.longitudeInput || '';
    }

    return (
      this._longitude || getFieldValue(this._recordData, `${this.parent.objectApiName}.${this.longitudeField}`) || ''
    );
  }

  get streetField() {
    return this.parent[`streetField${this.address}`];
  }

  get suburbField() {
    return this.parent[`suburbField${this.address}`];
  }

  get stateField() {
    return this.parent[`stateField${this.address}`];
  }

  get countryField() {
    return this.parent[`countryField${this.address}`];
  }

  get cityField() {
    return this.parent[`cityField${this.address}`];
  }

  get postalCodeField() {
    return this.parent[`postalCodeField${this.address}`];
  }

  get placeIdField() {
    return this.parent[`placeIdField${this.address}`];
  }

  get latitudeField() {
    return this.parent[`latitudeField${this.address}`];
  }

  get longitudeField() {
    return this.parent[`longitudeField${this.address}`];
  }

  get labelToShow() {
    return this.parent[`labelToShow${this.address}`];
  }

  get _isRequiredSearch() {
    return this.parent[`requiredSearch${this.address}`];
  }

  get isRequiredStreet() {
    return this.parent[`requiredStreet${this.address}`];
  }

  get isRequiredSuburb() {
    return this.parent[`requiredSuburb${this.address}`];
  }

  get isRequiredCity() {
    return this.parent[`requiredCity${this.address}`];
  }

  get isRequiredState() {
    return this.parent[`requiredState${this.address}`];
  }

  get isRequiredCountry() {
    return this.parent[`requiredCountry${this.address}`];
  }

  get isRequiredPostalCode() {
    return this.parent[`requiredPostalCode${this.address}`];
  }

  get _useShortCodes() {
    return this.parent[`stateAndCountryShortCodes${this.address}`];
  }

  get _countryFilters() {
    return this.parent[`countryFilters${this.address}`];
  }

  get showMap() {
    return this.parent[`showMap${this.address}`];
  }

  get editEnabled() {
    return this.parent[`editEnabled${this.address}`];
  }

  get showButtons() {
    return this.parent[`showButtons${this.address}`];
  }

  get editAlwaysEnabled() {
    return this.parent[`editAlwaysEnabled${this.address}`];
  }

  get disabledInputsWhenFound() {
    return this.parent[`disabledInputsWhenFound${this.address}`] && (this._addressFound || !!this.placeId);
  }

  get allowSearch() {
    return (this.isInFlow && this.parent.searchEnabled) || !this.isInFlow;
  }

  get disabledInputsWhenFoundFlow() {
    return this.parent.disabledInputs && (this._addressFound || !this.allowSearch);
  }

  get showIndividualFieldsInFlow() {
    return !this.parent.hideEditFields;
  }

  get showMapInFlow() {
    return this.showMap && this.isInFlow && !this.currentLocationError && this.mapMarkers && this.mapMarkers.length > 0;
  }

  get showMapErrorInFlow() {
    return this.showMap && this.currentLocationError;
  }

  get showSuburbInFlow() {
    return this.parent.showSuburb;
  }

  get showStateInFlow() {
    return this.parent.showState;
  }

  get fields() {
    const theFields = [];

    // street
    if (this.streetField) {
      theFields.push(`${this.parent.objectApiName}.${this.streetField}`);
    }

    // suburb
    if (this.suburbField) {
      theFields.push(`${this.parent.objectApiName}.${this.suburbField}`);
    }

    // state
    if (this.stateField) {
      theFields.push(`${this.parent.objectApiName}.${this.stateField}`);
    }

    // country
    if (this.countryField) {
      theFields.push(`${this.parent.objectApiName}.${this.countryField}`);
    }

    // city
    if (this.cityField) {
      theFields.push(`${this.parent.objectApiName}.${this.cityField}`);
    }

    // postal code
    if (this.postalCodeField) {
      theFields.push(`${this.parent.objectApiName}.${this.postalCodeField}`);
    }

    // google place id
    if (this.placeIdField) {
      theFields.push(`${this.parent.objectApiName}.${this.placeIdField}`);
    }

    // latitude
    if (this.latitudeField) {
      theFields.push(`${this.parent.objectApiName}.${this.latitudeField}`);
    }

    // longitude
    if (this.longitudeField) {
      theFields.push(`${this.parent.objectApiName}.${this.longitudeField}`);
    }

    return theFields;
  }

  get isInRecordPage() {
    return this.parent.recordId;
  }

  get isInFlow() {
    return !this.parent.recordId;
  }

  get isEditing() {
    return this.editAlwaysEnabled || this.editing || this.isInFlow;
  }

  get dropdownClasses() {
    let dropdownClasses = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
    if (
      (this.searchedResults.length > 0 || this.loadingAddresses || this.noRecordsFound) &&
      this.searchText.trim().length > 3
    ) {
      dropdownClasses += ' slds-is-open';
    }

    return dropdownClasses;
  }

  get viewModeClasses() {
    return `border-bottom slds-form-element slds-grid slds-p-bottom--x-small slds-p-top--xx-small ${
      this.parent.showInAccordion ? '' : 'slds-m-left--medium slds-m-right--small'
    }`;
  }

  get countryInputClasses() {
    if (this.isInFlow) {
      return `slds-size--${this.showStateInFlow ? '6' : '3'}-of-6`;
    }

    return `'slds-m-bottom--none slds-size--${this.stateField ? '6' : '3'}-of-6`;
  }

  get cityInputClasses() {
    if (this.isInFlow) {
      return `slds-size--${this.showSuburbInFlow ? '3' : '6'}-of-6`;
    }

    return `slds-m-bottom--none slds-size--${this.suburbField ? '3' : '6'}-of-6`;
  }

  get requiredStar() {
    return this._isRequiredSearch ? '*' : '';
  }

  get _formattedAddress() {
    return `${this.street}, ${this.city}, ${this.state}, ${this.country}`;
  }

  get mapViewOptions() {
    return {
      draggable: false,
      zoomControl: false,
      scrollwheel: false,
      disableDefaultUI: true,
      disableDoubleClickZoom: true,
    };
  }

  // =======================================================================================================================================================================================================================================
  // private methods
  // =======================================================================================================================================================================================================================================
  _generateSessionToken() {
    let nowTime = new Date().getTime();
    let nowTime2 = (performance && performance.now && performance.now() * 1000) || 0; //Time in microseconds since page-load or 0 if unsupported

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (text) => {
      let random = Math.random() * 16;
      if (nowTime > 0) {
        random = (nowTime + random) % 16 | 0;
        nowTime = Math.floor(nowTime / 16);
      } else {
        random = (nowTime2 + random) % 16 | 0;
        nowTime2 = Math.floor(nowTime2 / 16);
      }
      return (text === 'x' ? random : (random & 0x7) | 0x8).toString(16);
    });
  }

  _buildMapMarkers() {
    // if we have an empty address, set the current location
    if (!this.street && !this.city && !this.country && (!this.state || !this.suburb) && !this.postalCode) {
      this._getCurrentLocation();
    } else {
      this._setMapMarkers(this.latitude, this.longitude);
    }
  }

  _reduceErrors(errors) {
    if (!Array.isArray(errors)) {
      errors = [errors];
    }

    return (
      errors
        // Remove null/undefined items
        .filter((error) => !!error)
        // Extract an error message
        .map((error) => {
          // UI API read errors
          if (Array.isArray(error.body)) {
            return error.body.map((e) => e.message);
          }
          // Page level errors
          else if (error?.body?.pageErrors && error.body.pageErrors.length > 0) {
            return error.body.pageErrors.map((e) => e.message);
          }
          // Field level errors
          else if (error?.body?.fieldErrors && Object.keys(error.body.fieldErrors).length > 0) {
            const fieldErrors = [];
            Object.values(error.body.fieldErrors).forEach((errorArray) => {
              fieldErrors.push(...errorArray.map((e) => e.message));
            });
            return fieldErrors;
          }
          // UI API DML page level errors
          else if (error?.body?.output?.errors && error.body.output.errors.length > 0) {
            return error.body.output.errors.map((e) => e.message);
          }
          // UI API DML field level errors
          else if (error?.body?.output?.fieldErrors && Object.keys(error.body.output.fieldErrors).length > 0) {
            const fieldErrors = [];
            Object.values(error.body.output.fieldErrors).forEach((errorArray) => {
              fieldErrors.push(...errorArray.map((e) => e.message));
            });
            return fieldErrors;
          }
          // UI API DML, Apex and network errors
          else if (error.body && typeof error.body.message === 'string') {
            let errorToReturn;
            // try the json
            try {
              const parsed = JSON.parse(error.body.message);
              const statusCode = parsed.code;
              errorToReturn = `${statusCode !== 700 ? 'ERROR: ' : ''}${parsed.message}`;
            } catch (e) {
              errorToReturn = error.body.message;
            }

            return errorToReturn;
          }
          // JS errors
          else if (typeof error.message === 'string') {
            return error.message;
          }

          // String errors
          else if (typeof error === 'string') {
            return error;
          }

          // Unknown error shape so try HTTP status text
          return error.statusText;
        })
        // Flatten
        .reduce((prev, curr) => prev.concat(curr), [])
        // Remove empty strings
        .filter((message) => !!message)
    );
  }

  _getCurrentLocation() {
    // get the current location from the navigator method or show an error
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this._setMapMarkers(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.currentLocationError = 'User denied the request for Geolocation.';
            break;
          case error.POSITION_UNAVAILABLE:
            this.currentLocationError = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            this.currentLocationError = 'The request to get user location timed out.';
            break;
          default:
            this.currentLocationError = 'An unknown error occurred.';
            break;
        }
      },
    );
  }

  _setMapMarkers(latitude, longitude, description = '') {
    let location;

    // if we have latitude and longitude
    if (latitude && longitude) {
      location = {
        Latitude: latitude,
        Longitude: longitude,
      };
    } else {
      location = {
        City: this.city,
        Country: this.country,
        PostalCode: this.postalCode,
        State: this.state,
        Street: this.street,
      };
    }

    this.mapMarkers = [
      {
        location: location,
        title: 'Address',
        description: description || this._formattedAddress,
      },
    ];
  }

  _clearValues() {
    this._street = '';
    this._suburb = '';
    this._city = '';
    this._state = '';
    this._postalCode = '';
    this._country = '';
    this._placeId = '';
    this._longitude = '';
    this._latitude = '';

    if (this.isInFlow) {
      this.parent.streetOutput = '';
      this.parent.suburbOutput = '';
      this.parent.cityOutput = '';
      this.parent.stateOutput = '';
      this.parent.postalCodeOutput = '';
      this.parent.countryOutput = '';
      this.parent.placeIdOutput = '';
      this.parent.longitudeOutput = '';
      this.parent.latitudeOutput = '';
    }
  }

  // =======================================================================================================================================================================================================================================
  // handler methods
  // =======================================================================================================================================================================================================================================
  handleSearch(event) {
    this.searchText = event.target.value;

    if (this.searchText.trim().length > 3) {
      this.loadingAddresses = true;
      this.searchedResults = [];
      this.noRecordsFound = false;

      // clear the time out if exists
      if (this._timerId) {
        clearTimeout(this._timerId);
      }

      // do the search after 500 milliseconds to avoid searching a lot of times on each key stroke
      // eslint-disable-next-line @lwc/lwc/no-async-operation
      this._timerId = window.setTimeout(() => {
        // if we still have something to search for
        if (this.searchText) {
          getAddresses({
            searchText: this.searchText,
            sessionToken: this._sessionToken,
            countryFilters: this._countryFilters,
          })
            .then((res) => {
              if (res.isSuccess) {
                this.error = false;
                this.errorFromAPI = false;
                this.loadingAddresses = false;
                const parsedResponse = JSON.parse(res.data);

                if (parsedResponse.predictions.length === 0) {
                  this.noRecordsFound = true;
                } else {
                  this.noRecordsFound = false;
                  this.searchedResults = parsedResponse.predictions;
                }
              } else {
                this.error = false;
                this.errorFromAPI = `Error requesting the address from Google - ${res.errorMessage}`;
              }
            })
            .catch((error) => {
              this.loadingAddresses = false;
              this.errorFromAPI = false;
              this.error = `Error requesting the address details - ${this._reduceErrors(error)}`;
            });
        } else {
          this.loadingAddresses = false;
        }
      }, 500);
    } else {
      this.searchedResults = [];
    }
  }

  handleSelectAddress(event) {
    const selectedId = event.currentTarget.dataset.id;
    const selectedDescription = event.currentTarget.dataset.description;

    if (selectedId) {
      this.showSpinner = true;
      getAddressDetails({ placeId: selectedId, sessionToken: this._sessionToken })
        .then((res) => {
          this.showSpinner = false;
          this.searchedResults = [];

          if (res.isSuccess) {
            const parsedResponse = JSON.parse(res.data);

            let address = {
              formattedAddress: selectedDescription, // I need to store the address from the autocomplete in here, because for some reason the get Place details don't bring back the full address (e.g. 10a becomes 10)
              street: '',
              suburb: '',
              city: '',
              state: '',
              country: '',
              postalCode: '',
              latitude: parsedResponse.result.geometry.location.lat,
              longitude: parsedResponse.result.geometry.location.lng,
              placeId: parsedResponse.result.place_id,
            };

            // clear the old values
            this._clearValues();

            // for each address component of the return
            parsedResponse.result.address_components.forEach((comp) => {
              const type = comp.types[0];

              let streetNumber;

              switch (type) {
                case 'sublocality_level_1':
                  address.suburb = comp.long_name;
                  break;
                case 'sublocality':
                  address.suburb = comp.long_name;
                  break;
                case 'locality':
                  address.city = comp.long_name;
                  break;
                case 'postal_town':
                  address.city = comp.long_name;
                  break;
                case 'administrative_area_level_2':
                  address.city = comp.long_name;
                  break;
                case 'administrative_area_level_1':
                  address.state = this._useShortCodes ? comp.short_name : comp.long_name;
                  break;
                case 'country':
                  address.country = this._useShortCodes ? comp.short_name : comp.long_name;
                  break;
                case 'postal_code':
                  address.postalCode = comp.long_name; // do the short code check here
                  break;
                case 'route':
                  streetNumber = address.formattedAddress
                    .substr(0, address.formattedAddress.indexOf(comp.long_name))
                    .trim();
                  address.street = streetNumber + ' ' + comp.long_name;
                  break;
                default:
                  break;
              }
            });

            this._street = address.street;

            // if we don't have a suburb field append it to the street if any
            if ((this.isInRecordPage && !this.suburbField) || (this.isInFlow && !this.showSuburbInFlow)) {
              this._street += address.suburb ? ', ' + address.suburb : '';
            } else {
              this._suburb = address.suburb;
            }

            this._city = address.city;
            this._state = address.state;
            this._postalCode = address.postalCode;
            this._country = address.country;
            this._placeId = address.placeId;
            this._longitude = address.longitude;
            this._latitude = address.latitude;

            if (this.isInFlow) {
              this.parent.streetOutput = address.street; // return only the street as the suburb is in another field
              this.parent.suburbOutput = address.suburb;
              this.parent.cityOutput = this._city;
              this.parent.stateOutput = this._state;
              this.parent.postalCodeOutput = this._postalCode;
              this.parent.countryOutput = this._country;
              this.parent.placeIdOutput = this._placeId;
              this.parent.longitudeOutput = this._longitude;
              this.parent.latitudeOutput = this._latitude;

              this._setMapMarkers(address.latitude, address.longitude, selectedDescription);
            }

            this._addressFound = true;
            this.isNotChanged = false;
            this.searchText = '';
          } else {
            this.error = `Error requesting the address details from Google - ${res.errorMessage}`;
          }
        })
        .catch((error) => {
          this.showSpinner = false;
          this.error = `Error requesting the address details - ${this._reduceErrors(error)}`;
        });
    }
  }

  handleChangeInput(event) {
    this.isNotChanged = false;

    if (this.isInFlow) {
      this.parent[`${event.currentTarget.dataset.name}Output`] = event.target.value;
    }
  }

  handleSave(event) {
    event.preventDefault(); // stop the form from submitting
    const fields = event.detail.fields;

    if (this._isRequiredSearch && !this._placeId) {
      this.handleSaveError({
        detail:
          "The search is required for the address and you didn't use it. Please use the Search box to find a valid address.",
      });
    } else {
      this.showSpinner = true;
      this.template.querySelector('lightning-record-edit-form').submit(fields);
    }
  }

  handleSaveSuccess() {
    this.showSpinner = false;
    if (!this.editAlwaysEnabled) this.handleToggleEdit();
    this.isNotChanged = true;
  }

  handleSaveError(e) {
    this.showSpinner = false;
    this.error = this._reduceErrors(e.detail);
  }

  handleCancel() {
    const inputFields = this.template.querySelectorAll('lightning-input-field');
    if (inputFields) {
      inputFields.forEach((field) => {
        field.reset();
        // reset the fields to show
        this[`_${field.dataset.name}`] = field.value;
      });
    }
    this.isNotChanged = true;
    if (!this.editAlwaysEnabled) this.handleToggleEdit();
  }

  handleToggleEdit() {
    this.editing = !this.editing;
    this.searchText = '';
  }

  handleOnLoad() {
    this.finishLoaded = true;
  }
}
