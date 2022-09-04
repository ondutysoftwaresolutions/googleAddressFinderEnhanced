@IsTest
public class GoogleAddressFinderControllerTest {
  @IsTest
  static void testGetAddressesSuccess() {
    Test.startTest();

    Test.setMock(HttpCalloutMock.class, new GoogleAddressFinderMock(false, 'addresses'));

    GoogleAddressFinderController.Response response = GoogleAddressFinderController.getAddresses(
      'Test',
      '123',
      'NZ,AU'
    );

    Test.stopTest();

    System.assertEquals(true, response.isSuccess, 'The request was not successful');
    System.assertEquals(null, response.errorMessage, 'The request have an error');
    System.assertNotEquals(null, response.data, 'The request have not any data');
  }

  @IsTest
  static void testGetAddressesFailFromAPI() {
    Test.startTest();

    Test.setMock(HttpCalloutMock.class, new GoogleAddressFinderMock(false, 'addresses_error'));

    GoogleAddressFinderController.Response response = GoogleAddressFinderController.getAddresses(
      'Test',
      '123',
      'NZ,AU'
    );

    Test.stopTest();

    System.assertEquals(false, response.isSuccess, 'The request was successful');
    System.assertEquals('There was an error addresses', response.errorMessage, 'The request have not any error');
    System.assertEquals(null, response.data, 'The request have data');
  }

  @IsTest
  static void testGetAddressDetailsSuccess() {
    Test.startTest();

    Test.setMock(HttpCalloutMock.class, new GoogleAddressFinderMock(false, 'details'));

    GoogleAddressFinderController.Response response = GoogleAddressFinderController.getAddressDetails('123', '123');

    Test.stopTest();

    System.assertEquals(true, response.isSuccess, 'The request was not successful');
    System.assertEquals(null, response.errorMessage, 'The request have an error');
    System.assertNotEquals(null, response.data, 'The request have not any data');
  }

  @IsTest
  static void testGetAddressDetailsFailFromAPI() {
    Test.startTest();

    Test.setMock(HttpCalloutMock.class, new GoogleAddressFinderMock(false, 'details_error'));

    GoogleAddressFinderController.Response response = GoogleAddressFinderController.getAddressDetails('123', '123');

    Test.stopTest();

    System.assertEquals(false, response.isSuccess, 'The request was successful');
    System.assertEquals('There was an error details', response.errorMessage, 'The request have not any error');
    System.assertEquals(null, response.data, 'The request have data');
  }

  @IsTest
  static void testGetAddressesFailCalloutError() {
    Test.startTest();

    Test.setMock(HttpCalloutMock.class, new GoogleAddressFinderMock(true, 'addresses'));

    GoogleAddressFinderController.Response response = GoogleAddressFinderController.getAddresses(
      'Test',
      '123',
      'NZ,AU'
    );

    Test.stopTest();

    System.assertEquals(false, response.isSuccess, 'The request was successful');
    System.assertEquals(
      '{"message": "Error callout", "exception": {"message": "error"}}',
      response.errorMessage,
      'The request have not any error'
    );
    System.assertEquals(null, response.data, 'The request have data');
  }
}
