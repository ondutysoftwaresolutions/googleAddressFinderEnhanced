import { LightningElement, api } from 'lwc';

export default class GoogleAddressFinder extends LightningElement {
  @api recordId;
  @api objectApiName;

  @api showInAccordion = false;
  @api accordionTitle;
  @api defaultOpen;
  @api numberOfColumns = '2';

  // addresses
  @api requiredSearch1;
  @api streetField1;
  @api suburbField1;
  @api cityField1;
  @api stateField1;
  @api countryField1;
  @api postalCodeField1;
  @api placeIdField1;
  @api latitudeField1;
  @api longitudeField1;
  @api showMap1;
  @api editEnabled1;
  @api editAlwaysEnabled1;
  @api showButtons1;
  @api labelToShow1;
  @api disabledInputsWhenFound1;
  @api countryFilters1;
  @api stateAndCountryShortCodes1;
  @api requiredStreet1;
  @api requiredSuburb1;
  @api requiredCity1;
  @api requiredState1;
  @api requiredCountry1;
  @api requiredPostalCode1;

  @api requiredSearch2;
  @api streetField2;
  @api suburbField2;
  @api cityField2;
  @api stateField2;
  @api countryField2;
  @api postalCodeField2;
  @api placeIdField2;
  @api latitudeField2;
  @api longitudeField2;
  @api showMap2 = false;
  @api editEnabled2 = false;
  @api editAlwaysEnabled2 = false;
  @api showButtons2 = false;
  @api labelToShow2;
  @api disabledInputsWhenFound2;
  @api countryFilters2;
  @api stateAndCountryShortCodes2 = false;
  @api requiredStreet2;
  @api requiredSuburb2;
  @api requiredCity2;
  @api requiredState2;
  @api requiredCountry2;
  @api requiredPostalCode2;

  // flow input
  @api disabledInputs;
  @api hideEditFields;
  @api searchEnabled;
  @api showSuburb;
  @api showState;
  @api streetInput;
  @api suburbInput;
  @api cityInput;
  @api stateInput;
  @api countryInput;
  @api postalCodeInput;
  @api placeIdInput;
  @api latitudeInput;
  @api longitudeInput;

  // flow outputs
  @api streetOutput;
  @api suburbOutput;
  @api cityOutput;
  @api stateOutput;
  @api countryOutput;
  @api postalCodeOutput;
  @api placeIdOutput;
  @api latitudeOutput;
  @api longitudeOutput;

  error = false;
  _opened = false;

  // =======================================================================================================================================================================================================================================
  // lifecycle methods
  // =======================================================================================================================================================================================================================================
  connectedCallback() {
    // check that at least a suburb or a state field is populated
    if (!this.showInFlow && !this.suburbField1 && !this.stateField1) {
      this.error = 'A State/Province and/or Suburb is needed to be able to use this component';
    }

    // check the completeness of address 2
    if (
      this.streetField2 ||
      this.cityField2 ||
      this.stateField2 ||
      this.countryField2 ||
      this.postalCodeField2 ||
      this.suburbField2
    ) {
      if (
        !this.streetField2 ||
        !this.cityField2 ||
        (!this.stateField2 && !this.suburbField2) ||
        !this.countryField2 ||
        !this.postalCodeField2
      ) {
        this.error =
          'A Street, City, State/Province or Suburb, Country and Postal Code field are required to be able to use the Second Address';
      }
    }

    // set initial values for flows
    if (this.showInFlow) {
      this._setFlowDefaultValues();
    }

    // check that the country filter for address are valid
    if (this.countryFilters1) {
      this._validateCountryFilter(this.countryFilters1);
    }

    if (this.countryFilters2) {
      this._validateCountryFilter(this.countryFilters2);
    }
  }

  // =======================================================================================================================================================================================================================================
  // validate for flow screen, if it's required and we select an address or it's not required
  // =======================================================================================================================================================================================================================================
  @api validate() {
    // required search
    if (this.requiredSearch1 && !this.placeIdOutput) {
      return {
        isValid: false,
        errorMessage:
          "The search is required for the address and you didn't use it. Please use the Search box to find a valid address.",
      };
    }

    // required street
    if (this.requiredStreet1 && !this.streetOutput) {
      return {
        isValid: false,
        errorMessage: 'The Street is required. You must add one before continue',
      };
    }

    // required city
    if (this.requiredCity1 && !this.cityOutput) {
      return {
        isValid: false,
        errorMessage: 'The City is required. You must add one before continue',
      };
    }

    // required state
    if (this.requiredState1 && !this.stateOutput) {
      return {
        isValid: false,
        errorMessage: 'The State is required. You must add one before continue',
      };
    }

    // required country
    if (this.requiredCountry1 && !this.countryOutput) {
      return {
        isValid: false,
        errorMessage: 'The Country is required. You must add one before continue',
      };
    }

    // required postal code
    if (this.requiredPostalCode1 && !this.postalCodeOutput) {
      return {
        isValid: false,
        errorMessage: 'The Postal Code is required. You must add one before continue',
      };
    }

    return { isValid: true };
  }

  // =======================================================================================================================================================================================================================================
  // getter methods
  // =======================================================================================================================================================================================================================================
  get that() {
    return this;
  }

  get isOpen() {
    return this.defaultOpen || this._opened ? 'opened' : '';
  }

  get hasSecondAddress() {
    return this.streetField2;
  }

  get showInFlow() {
    return !this.recordId;
  }

  get classesFirst() {
    return `slds-size--1-of-${!this.showInFlow ? this.numberOfColumns : '1'} ${
      !this.showInFlow ? 'slds-p-top--x-small' : ''
    } ${!this.showInFlow && this.numberOfColumns === '2' ? 'slds-p-right--large' : ''}`;
  }

  get classesSecond() {
    return `slds-p-top--x-small slds-size--1-of-${this.numberOfColumns}`;
  }

  // =======================================================================================================================================================================================================================================
  // private methods
  // =======================================================================================================================================================================================================================================
  _validateCountryFilter(filter) {
    if (filter) {
      let splitFilter = filter.split(',');

      // only allow 5 countries
      if (splitFilter.length > 5) {
        this.error = `The maximum number for country filters are 5. You specified ${splitFilter.length}`;
      } else {
        // check that each one has 2 digits
        splitFilter.forEach((country) => {
          if (country.length !== 2) {
            this.error = `The country must be specified in a 2 digit format. ${country} does not match this specification (Length: ${country.length})`;
          }
        });
      }
    }
  }

  _setFlowDefaultValues() {
    // set default specifically for flows, this is because flows does not use the default from the configuration XML file yet.
    this.requiredSearch1 = this.requiredSearch1 === undefined ? false : this.requiredSearch1;
    this.labelToShow1 = this.labelToShow1 === undefined ? 'Address' : this.labelToShow1;
    this.stateAndCountryShortCodes1 =
      this.stateAndCountryShortCodes1 === undefined ? false : this.stateAndCountryShortCodes1;
    this.showMap1 = this.showMap1 === undefined ? false : this.showMap1;
    this.disabledInputs = this.disabledInputs === undefined ? false : this.disabledInputs;
    this.hideEditFields = this.hideEditFields === undefined ? false : this.hideEditFields;
    this.searchEnabled = this.searchEnabled === undefined ? true : this.searchEnabled;
    this.showSuburb = this.showSuburb === undefined ? false : this.showSuburb;
    this.showState = this.showState === undefined ? true : this.showState;
    this.requiredStreet1 = this.requiredStreet1 === undefined ? false : this.requiredStreet1;
    this.requiredSuburb1 = this.requiredSuburb1 === undefined ? false : this.requiredSuburb1;
    this.requiredCity1 = this.requiredCity1 === undefined ? false : this.requiredCity1;
    this.requiredState1 = this.requiredState1 === undefined ? false : this.requiredState1;
    this.requiredCountry1 = this.requiredCountry1 === undefined ? false : this.requiredCountry1;
    this.requiredPostalCode1 = this.requiredPostalCode1 === undefined ? false : this.requiredPostalCode1;

    // set default output values
    this.streetOutput = this.streetInput;
    this.suburbOutput = this.suburbInput;
    this.cityOutput = this.cityInput;
    this.stateOutput = this.stateInput;
    this.countryOutput = this.countryInput;
    this.postalCodeOutput = this.postalCodeInput;
    this.placeIdOutput = this.placeIdInput;
    this.latitudeOutput = this.latitudeInput;
    this.longitudeOutput = this.longitudeInput;
  }

  // =======================================================================================================================================================================================================================================
  // handler methods
  // =======================================================================================================================================================================================================================================
  handleToggleSection() {
    this._opened = !this._opened;
  }
}
