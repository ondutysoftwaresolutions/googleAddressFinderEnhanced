/*************************************************************************************************************
 * @name			GoogleAddressFinderController
 * @author			Pablo Martinez <ing.martinez.pablo@gmail.com>
 * @created			04 / 09 / 2022
 * @description		Class to manage the Google Address Finder Enhanced LWC
 * @TestClass		GoogleAddressFinderControllerTest
 *
 * Changes (version)
 * -----------------------------------------------------------------------------------------------------------
 * 				No.		Date			Author					Description
 * 				----	------------	--------------------	----------------------------------------------
 * @version		1.0		2022-09-04		Pablo Martinez			Creation of the class
 *
 **************************************************************************************************************/
public with sharing class GoogleAddressFinderController {
  private static Google_Address_Finder_Setting__mdt settings = Google_Address_Finder_Setting__mdt.getInstance(
    'Places_API'
  );

  /*********************************************************************************************************
   * @name			doCallout
   * @author			Pablo Martinez <ing.martinez.pablo@gmail.com>
   * @created			04 / 09 / 2022
   * @description		Method that does the GET callout to the specified endpoint
   * @param			String endpoint : the endpoint to call
   * @return			Response wrapper with the isSuccess flag, errorMessage (if any) and the data from the callout response
   **********************************************************************************************************/
  private static Response doCallout(String endpoint) {
    Response theResponse = new Response();

    Http http = new Http();
    HttpRequest request = new HttpRequest();

    request.setMethod('GET');
    request.setEndpoint(endpoint + '&key=' + settings.API_Key__c);
    request.setTimeout(120000);
    HttpResponse response = http.send(request);

    Map<String, Object> parsedResponse = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());

    // success
    if (response.getStatusCode() == 200) {
      if (((String) parsedResponse.get('status')) == 'OK') {
        theResponse.isSuccess = true;
        theResponse.errorMessage = null;
        theResponse.data = response.getBody();
      } else {
        theResponse.isSuccess = false;
        theResponse.data = null;
        theResponse.errorMessage = (String) parsedResponse.get('error_message');
      }
    } else {
      theResponse.isSuccess = false;
      theResponse.data = null;
      theResponse.errorMessage = response.getBody();
    }

    return theResponse;
  }

  /*********************************************************************************************************
   * @name			getAddresses
   * @author			Pablo Martinez <ing.martinez.pablo@gmail.com>
   * @created			04 / 09 / 2022
   * @description		Get a list of matching addresses given a search text and filters
   * @param			String searchText : the text to search for
   * @param			String sessionToken : a unique UUID token to send to each request to identified the same request across callouts (for Google Billing)
   * @param			String countryFilters : Comma separated list of countries (2 digit codes) to filter the results
   * @return			Response wrapper with the isSuccess flag, errorMessage (if any) and the data from the callout response
   **********************************************************************************************************/
  @AuraEnabled
  public static Response getAddresses(String searchText, String sessionToken, String countryFilters) {
    String endpoint =
      settings.Place_Autocomplete_URL__c +
      '?input=' +
      EncodingUtil.urlEncode(searchText, 'UTF-8') +
      '&sessiontoken=' +
      sessionToken;

    // if we have country filters add them to the endpoint too
    if (String.isNotEmpty(countryFilters)) {
      String countriesToAdd = '';

      List<String> countries = countryFilters.split(',');
      for (String country : countries) {
        countriesToAdd += (String.isNotEmpty(countriesToAdd) ? '|' : '') + 'country:' + country.toLowerCase();
      }

      endpoint += '&components=' + countriesToAdd;
    }

    return doCallout(endpoint);
  }

  /*********************************************************************************************************
   * @name			getAddressDetails
   * @author			Pablo Martinez <ing.martinez.pablo@gmail.com>
   * @created			04 / 09 / 2022
   * @description		Method to get the full set of details from Google given a specific place_id
   * @param			String placeId : The place_id from Google obtained with the getAddresses method
   * @param			String sessionToken : a unique UUID token to send to each request to identified the same request across callouts (for Google Billing)
   * @return			Response wrapper with the isSuccess flag, errorMessage (if any) and the data from the callout response
   **********************************************************************************************************/
  @AuraEnabled
  public static Response getAddressDetails(String placeId, String sessionToken) {
    String endpoint =
      settings.Place_Details_URL__c +
      '?placeid=' +
      EncodingUtil.urlEncode(placeId, 'UTF-8') +
      '&sessiontoken=' +
      sessionToken;

    return doCallout(endpoint);
  }

  // wrapper class to return to the UI
  public class Response {
    @AuraEnabled
    public Boolean isSuccess;

    @AuraEnabled
    public String data;

    @AuraEnabled
    public String errorMessage;
  }
}
