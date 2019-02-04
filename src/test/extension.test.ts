//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert'
import * as Moq from 'typemoq'
import { IHttpClient } from '../helpers/PlayFabHttpHelper'
import { CreateAccountRequest, CreateAccountResponse, LoginResponse, LoginRequest, LogoutRequest, LogoutResponse } from '../models/PlayFabAccountModels';
import { PlayFabLoginManager, IPlayFabLoginInputGatherer } from '../playfab-account';
import { beforeEach } from 'mocha';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from 'vscode';
// import * as myExtension from '../extension';

// Defines a Mocha test suite to group tests of similar kind together
suite('Extension Tests', function () {

  class User {
    email: string;
    password: string;
    twofa: string;
    studioName: string;
    devToolName: string;
    devToolVersion: string;
    token: string;
  }

  let user1: User = {
    email: "user1@domain.suffix",
    password: "supersecret",
    twofa:  "123456",
    studioName:  "Small And Fast",
    devToolName:  "UnitTest",
    devToolVersion:  "001",
    token: "abcdef"
  };

  let user2: User = {
    email: "user2@domain.suffix",
    password: "SuperSecret",
    twofa: "456789",
    studioName: "Big And Slow",
    devToolName: "UnitTest",
    devToolVersion: "001",
    token: "ghi123",
  };

  let user: User;
  let inputGatherer: Moq.IMock<IPlayFabLoginInputGatherer> = Moq.Mock.ofType<IPlayFabLoginInputGatherer>();
  inputGatherer.setup(x => x.getUserInputForCreateAccount())
    .returns(async () => {
      let result: CreateAccountRequest = {
        Email: user.email,
        Password: user.password,
        StudioName: user.studioName,
        DeveloperToolProductName: user.devToolName,
        DeveloperToolProductVersion: user.devToolVersion
      };
      return result;
    });
  inputGatherer.setup(x => x.getUserInputForLogin())
    .returns(async () => {
      let result: LoginRequest = {
        Email: user.email,
        Password: user.password,
        TwoFactorAuth: user.twofa,
        DeveloperToolProductName: user.devToolName,
        DeveloperToolProductVersion: user.devToolVersion
      };
      return result;
    });


  let httpCli: Moq.IMock<IHttpClient> = Moq.Mock.ofType<IHttpClient>();
  httpCli.setup(x => x.makeApiCall(
    Moq.It.isValue('/DeveloperTools/User/Login'),
    Moq.It.isAnyString(),
    Moq.It.is<LoginRequest>(x => true),
    Moq.It.isAny(),
    Moq.It.isAny()))
    .returns(
      (path: string,
        endpoint: string,
        request: LoginRequest,
        successCallback: (response: LoginResponse) => void,
        errorCallback: (code: number, message: string) => void
      ): Promise<void> => {
        let response: LoginResponse = {
          DeveloperClientToken: user.token,
        };
        successCallback(response);
        return;
      });

  httpCli.setup(x => x.makeApiCall(
    Moq.It.isValue('/DeveloperTools/User/Logout'),
    Moq.It.isAnyString(),
    Moq.It.is<LoginRequest>(x => true),
    Moq.It.isAny(),
    Moq.It.isAny()))
    .returns(
      (path: string,
        endpoint: string,
        request: LogoutRequest,
        successCallback: (response: LogoutResponse) => void,
        errorCallback: (code: number, message: string) => void
      ): Promise<void> => {
        let response: LogoutResponse = {
        };
        successCallback(response);
        return;
      });

  httpCli.setup(x => x.makeApiCall(
    Moq.It.isValue('/DeveloperTools/User/RegisterAccount'),
    Moq.It.isAnyString(),
    Moq.It.is<CreateAccountRequest>(x => true),
    Moq.It.isAny(),
    Moq.It.isAny()))
    .returns(
      (path: string,
        endpoint: string,
        request: CreateAccountRequest,
        successCallback: (response: CreateAccountResponse) => void,
        errorCallback: (code: number, message: string) => void
      ): Promise<void> => {
        let response: CreateAccountResponse = {
          DeveloperClientToken: user.token
        };
        successCallback(response);
        return;
      });

  // Defines a Mocha unit test
  test('CreateAccountWhenLoggedOut', async function () {
    user = user1;
    let loginManager: PlayFabLoginManager = new PlayFabLoginManager(null, httpCli.object, inputGatherer.object);
    assert(loginManager.api.status === "Initializing", "Status is not Initializing");
    await loginManager.createAccount()
    assert(loginManager.api.status === "LoggedIn", "Status is not LoggedIn");
    let apiToken: string = loginManager.api.getToken();
    assert(apiToken === user1.token, "Token does not match");
  });

  test('CreateAccountDifferentUserWhenLoggedIn', async function () {
    user = user1;
    let loginManager: PlayFabLoginManager = new PlayFabLoginManager(null, httpCli.object, inputGatherer.object);
    assert(loginManager.api.status === "Initializing", "Status is not Initializing");
    await loginManager.login()
    assert(loginManager.api.status === "LoggedIn", "Status is not LoggedIn");
    let apiToken: string = loginManager.api.getToken();
    assert(apiToken === user1.token, "Token does not match");

    user = user2;

    await loginManager.createAccount()
    assert(loginManager.api.status === "LoggedIn", "Status is not LoggedIn");
    apiToken = loginManager.api.getToken();
    assert(apiToken === user2.token, "Token does not match");
  });
  
  test('LoginWhenLoggedOut', async function () {
    user = user1;
    let loginManager: PlayFabLoginManager = new PlayFabLoginManager(null, httpCli.object, inputGatherer.object);
    assert(loginManager.api.status === "Initializing", "Status is not Initializing");
    await loginManager.login()

    assert(loginManager.api.status === "LoggedIn", "Status is not LoggedIn");
    let apiToken: string = loginManager.api.getToken();
    assert(apiToken === user1.token, "Token does not match");
  });

  test('LoginSameUserWhenLoggedIn', async function () {
    user = user1;
    let loginManager: PlayFabLoginManager = new PlayFabLoginManager(null, httpCli.object, inputGatherer.object);
    assert(loginManager.api.status === "Initializing", "Status is not Initializing");
    await loginManager.login()
    assert(loginManager.api.status === "LoggedIn", "Status is not LoggedIn");
    let apiToken: string = loginManager.api.getToken();
    assert(apiToken === user1.token, "Token does not match");

    await loginManager.login()
    assert(loginManager.api.status === "LoggedIn", "Status is not LoggedIn");
    apiToken = loginManager.api.getToken();
    assert(apiToken === user1.token, "Token does not match");
  });

  test('LoginDifferentUserWhenLoggedIn', async function () {
    user = user1;
    let loginManager: PlayFabLoginManager = new PlayFabLoginManager(null, httpCli.object, inputGatherer.object);
    assert(loginManager.api.status === "Initializing", "Status is not Initializing");
    await loginManager.login()
    assert(loginManager.api.status === "LoggedIn", "Status is not LoggedIn");
    let apiToken: string = loginManager.api.getToken();
    assert(apiToken === user1.token, "Token does not match");

    user = user2;
    
    await loginManager.login()
    assert(loginManager.api.status === "LoggedIn", "Status is not LoggedIn");
    apiToken = loginManager.api.getToken();
    assert(apiToken === user2.token, "Token does not match");
  });

  test('LogoutWhenLoggedIn', async function () {
    user = user1;
    let loginManager: PlayFabLoginManager = new PlayFabLoginManager(null, httpCli.object, inputGatherer.object);
    await loginManager.login()
    assert(loginManager.api.status === "LoggedIn", "Status is not LoggedIn");
    await loginManager.logout();
    assert(loginManager.api.status === "LoggedOut", "Status is not LoggedOut");
  });

  test('LogoutWhenLoggedOut', async function () {
    user = user1;
    let loginManager: PlayFabLoginManager = new PlayFabLoginManager(null, httpCli.object, inputGatherer.object);
    await loginManager.login()
    assert(loginManager.api.status === "LoggedIn", "Status is not LoggedIn");
    await loginManager.logout();
    assert(loginManager.api.status === "LoggedOut", "Status is not LoggedOut");
    await loginManager.logout();
    assert(loginManager.api.status === "LoggedOut", "Status is not LoggedOut");
  });
})