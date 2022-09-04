/*************************************************************************************************************
 * @name			GoogleAddressFinderMock
 * @author			Pablo Martinez <ing.martinez.pablo@gmail.com>
 * @created			04 / 09 / 2022
 * @description		Mock Service for the Google Place Services
 *
 * Changes (version)
 * -----------------------------------------------------------------------------------------------------------
 * 				No.		Date			Author					Description
 * 				----	------------	--------------------	----------------------------------------------
 * @version		1.0		2022-09-04		Pablo Martinez			Creation of the class
 *
 **************************************************************************************************************/

public class GoogleAddressFinderMock implements HttpCalloutMock {
  public Boolean failed;
  public String service;

  public GoogleAddressFinderMock(Boolean failed, String service) {
    this.failed = failed;
    this.service = service;
  }

  public HTTPResponse respond(HTTPRequest req) {
    HttpResponse res = new HttpResponse();
    res.setHeader('Content-Type', 'application/json');

    if (this.failed) {
      res.setStatusCode(500);
      res.setBody('{"message": "Error callout", "exception": {"message": "error"}}');
    } else {
      String body;

      switch on service {
        when 'addresses' {
          body = '{"predictions":[{"description":"Paris, France","matched_substrings":[{"length":5,"offset":0}],"place_id":"ChIJD7fiBh9u5kcRYJSMaMOCCwQ","reference":"ChIJD7fiBh9u5kcRYJSMaMOCCwQ","structured_formatting":{"main_text":"Paris","main_text_matched_substrings":[{"length":5,"offset":0}],"secondary_text":"France"},"terms":[{"offset":0,"value":"Paris"},{"offset":7,"value":"France"}],"types":["locality","political","geocode"]},{"description":"Paris, TX, USA","matched_substrings":[{"length":5,"offset":0}],"place_id":"ChIJmysnFgZYSoYRSfPTL2YJuck","reference":"ChIJmysnFgZYSoYRSfPTL2YJuck","structured_formatting":{"main_text":"Paris","main_text_matched_substrings":[{"length":5,"offset":0}],"secondary_text":"TX, USA"},"terms":[{"offset":0,"value":"Paris"},{"offset":7,"value":"TX"},{"offset":11,"value":"USA"}],"types":["locality","political","geocode"]}],"status":"OK"}';
        }
        when 'details' {
          body = '{"html_attributions":[],"result":{"address_components":[{"long_name":"48","short_name":"48","types":["street_number"]},{"long_name":"Pirrama Road","short_name":"Pirrama Rd","types":["route"]},{"long_name":"Pyrmont","short_name":"Pyrmont","types":["locality","political"]},{"long_name":"City of Sydney","short_name":"City of Sydney","types":["administrative_area_level_2","political"]},{"long_name":"New South Wales","short_name":"NSW","types":["administrative_area_level_1","political"]},{"long_name":"Australia","short_name":"AU","types":["country","political"]},{"long_name":"2009","short_name":"2009","types":["postal_code"]}],"adr_address":"","business_status":"OPERATIONAL","formatted_address":"48 Pirrama Rd, Pyrmont NSW 2009, Australia","formatted_phone_number":"(02) 9374 4000","geometry":{"location":{"lat":-33.866489,"lng":151.1958561},"viewport":{"northeast":{"lat":-33.8655112697085,"lng":151.1971156302915},"southwest":{"lat":-33.86820923029149,"lng":151.1944176697085}}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/generic_business-71.png","icon_background_color":"#7B9EB0","icon_mask_base_uri":"https://maps.gstatic.com/mapfiles/place_api/icons/v2/generic_pinlet","international_phone_number":"+61 2 9374 4000","name":"Google Workplace 6","place_id":"ChIJN1t_tDeuEmsRUsoyG83frY4","rating":4,"reference":"ChIJN1t_tDeuEmsRUsoyG83frY4","types":["point_of_interest","establishment"],"url":"https://maps.google.com/?cid=10281119596374313554","user_ratings_total":939,"utc_offset":600,"vicinity":"48 Pirrama Road, Pyrmont","website":"http://google.com/"},"status":"OK"}';
        }
        when 'addresses_error' {
          body = '{"error_message":"There was an error addresses","status":"NO OK"}';
        }
        when 'details_error' {
          body = '{"error_message":"There was an error details","status":"NO OK"}';
        }
      }

      res.setStatusCode(200);
      res.setBody(body);
    }

    return res;
  }
}
