// to use the shell script commands bash
const { exec } = require("child_process");
// fs to read and write files
const fs = require("fs");
// ask user to enter value in the bash
const readline = require("readline");
// ask user to enter yes or no to complete the process
const yesno = require("yesno");

// handel the shell input and output
const readShellInput = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const { NAME, SCREENS, COLORS, API_ROUTES } = {
  NAME: "name",
  SCREENS: "screens",
  COLORS: "colors",
  API_ROUTES: "apiroutes",
};

// selected file name
let filePath;

// json file value
let fileValue = {};

let flutterProjectName = "";

let projectDirectory = "";

const packagesToInstall = [
  "flutter pub add get",
  "flutter pub add common_ui_toolkit",
];

const currentDirectory = process.cwd();

const vsCodeSettings = `{
    "dart.previewLsp": true,
    "launch": {
           "configurations": [],
           "compounds": []
    },
    "editor.codeActionsOnSave": {
           "source.fixAll": true,
           "source.organizeImports": true,
    },
    "debug.openDebug": "openOnDebugBreak",
    "[dart]": {
           // Automatically format code on save and during typing of certain characters
           // (like ';' and '}').
           "editor.formatOnSave": true,
           "editor.formatOnType": true,
           // Draw a guide line at 80 characters, where Dart's formatting will wrap code.
           "editor.rulers": [
                  80
           ],
    }
}`;

const apiRequestFileContent = `import 'dart:developer' as developer;

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import './index.dart';

class ApiRequest {
  String path, methoud;
  var body, response;
  bool withLoading, withErrorMessage;

  final AppLanguageController _appLanguageController =
      Get.find<AppLanguageController>();
  final MyAppController _myAppController = Get.find<MyAppController>();

  ApiRequest({
    @required this.path,
    this.body,
    this.methoud,
    this.withLoading = true,
    this.withErrorMessage = true,
  });

  Dio _dio() {
    // Put your authorization token here
    return Dio(
      BaseOptions(
        headers: {
          'Authorization': _myAppController.userData != null
              ? 'Bearer ' + _myAppController.userData['token'].toString()
              : '',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': _appLanguageController.appLocale,
          'platform': 'mobile',
        },
      ),
    );
  }

  void request({
    Function() beforeSend,
    Function(dynamic data, dynamic response) onSuccess,
    Function(dynamic error) onError,
  }) async {
    // start request time
    DateTime startTime = DateTime.now();

    try {
      // show  request detils in debug console
      showRequestDetails(
        methoud: methoud,
        path: path,
        body: body.toString(),
      );
      // strat spinnet loading
      if (withLoading) startLoading();
      // check methoud type
      switch (methoud) {
        case GET_METHOUD:
          response = await _dio()
              .get(BASE_URL + this.path, queryParameters: body);

          break;
        case POST_METHOUD:
          response = await _dio().post(BASE_URL + this.path, data: body);
          break;
        case PUT_METHOUD:
          response = await _dio().put(BASE_URL + this.path, data: body);
          break;
        case DELETE_METHOUD:
          response = await _dio().delete(BASE_URL + this.path, data: body);
          break;
      }
      // request time
      var time = DateTime.now().difference(startTime).inMilliseconds;
      // print response data in console
      printSuccessesResponse(response: response.data, time: time);
      if (withLoading) dismissLoading();
      if (onSuccess != null) {
        onSuccess(response.data['data'], response.data);
      }
    } catch (error) {
      // request time
      var time = DateTime.now().difference(startTime).inMilliseconds;
      var errorResponse;
      if (error is DioError) {
        errorResponse = error.response;
        // In case we get a null response for unknown reason
        var errorData = errorResponse != null
            ? errorResponse.data
            : {
                "errors": [
                  {"message": "Un handeled Error"}
                ]
              };
        //handle DioError here by error type or by error code
        if (withErrorMessage) {
          showMessage(
            description:
                errorData["errors"] != null && errorData["errors"].length > 0
                    ? errorData["errors"][0]["message"]
                    : errorData["message"],
            textColor: RED_COLOR,
          );
        }
        // print response error
        printRequestError(error: errorData, time: time);

        if (onError != null) {
          onError(errorData);
        }
      } else {
        // handle another errors
        developer.log('\x1B[31m **** Request catch another error ****');
        developer.log('\x1B[33m Error>> $error');
        developer.log('\x1B[31m ***************************');
      }
      if (withLoading) dismissLoading();
    }
  }
}
`;

const apiManagerIndex = `export './ApiRequest.dart';
export './UrlRoutes.dart';
export '../utils/index.dart';
`;

const screenIndexContent = (controller, screen) => `export './${screen}';
export './${controller}';
`;

const screenControllerContent = (controllerName) => `import '../index.dart';

class ${controllerName} extends GetxController {
  @override
  void onInit() {
    super.onInit();
  }

  @override
  void onReady() {
    super.onReady();
  }

  @override
  void onClose() {
    super.onClose();
  }
}`;

const screenContent = (
  controllerName,
  screenName
) => `import 'package:common_ui_toolkit/index.dart';

import '../index.dart';
class ${screenName} extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ContainerScreen(
      header: Header(
        title: 'Edit Profile',
        backColor: WHITE_COLOR,
      ),
      child: GetBuilder<${controllerName}>(
        init: ${controllerName}(),
        builder: (controller) => SingleChildScrollView(
          child: CommonContainer(
            style: CommonContainerModel(
              width: DEVICE_WIDTH,
              minHieght: DEVICE_HEIGHT,
            ),
            child: Column(
              children: [],
            ),
          ),
        ),
      ),
    );
  }
}
`;

const askUserToEnterFileName = (askMessage) => {
  // ask user to enter file directory
  readShellInput.question(
    askMessage || "\033[32m Please Enter Json File to Complete process \n",
    async (name) => {
      const selectedFilePath = name.replace(/\\/g, "/").split("/");
      const selectedFileName = selectedFilePath[
        selectedFilePath.length - 1
      ].replace(/'/g, "");

      // file path
      filePath = name;

      // check file type
      if (selectedFileName.includes(".json")) {
        // print the selected file name
        console.log("\033[36m" + ` Selected file is:${selectedFileName} \n`);

        const ok = await yesno({
          question: "\033[34m Are you sure you want to continue?[Y/N]",
          defaultValue: true,
        });
        // handle the result after the user has made a choice
        if (ok) {
          console.log("\033[32m Start Read Json File");
          completeReadJsonFile();
        } else {
          console.log("\033[31m Process Cancelled");
          console.log("\033[32m \nBYE BYE !!!");
          process.exit(0);
        }
      } else {
        handelErrorFileType();
      }
    }
  );

  // after failed enter Json file
  readShellInput.on("close", () => {
    console.log("\nBYE BYE !!!");
    process.exit(0);
  });
};

// complete process after press yes
const completeReadJsonFile = () => {
  fs.readFile(filePath.replace(/'/g, ""), "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    try {
      const selectedFileValue = JSON.parse(data);
      Object.entries(selectedFileValue).forEach(([key, value]) => {
        fileValue[key.toLocaleLowerCase()] = value;
      });
      createFlutterProject();
    } catch (e) {
      console.log(e);
      handelErrorFileType();
    }
  });
};

const handelErrorFileStructure = () => {
  console.log("\nError File Structure");
  console.log("\nPleas Follow this file structure and try agin ");
  console.log('\n{"name":"","age":"","address":""}');
};

const handelErrorFileType = () => {
  console.log("\033[31m \nError File Type \n");
  askUserToEnterFileName("\033[32m Pleas Enter Json File again: \n");
};

const createFlutterProject = () => {
  flutterProjectName = fileValue[NAME];
  console.log("\033[32m \nStart Create Flutter Project....");
  // create flutter project
  exec(`flutter create ${flutterProjectName}`, (error, stdout) => {
    if (error) {
      console.error(`error: ${error}`);
      return;
    }
    console.log(stdout);
    console.log("\033[35m Flutter Project Created Success $_$ \033[34m ");
    createVsCodeSettings();
  });
};

const createVsCodeSettings = () => {
  projectDirectory = `${currentDirectory}/${flutterProjectName}`;
  exec(
    `cd ./${flutterProjectName} &&  mkdir .vscode && touch .vscode/settings.json`,
    (error, stdout) => {
      if (error) console.error(`error: ${error}`);
      fs.appendFile(
        `${projectDirectory}/.vscode/settings.json`,
        vsCodeSettings,
        (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log(
              "\n \033[35m VsCode Settings Added Successful $_$ \033[34m "
            );
            createAppFolders();
          }
        }
      );
    }
  );
};

const createAppFolders = () => {
  console.log("\033[35m \n Assets folders added Successful.... \033[34m ");
  exec(
    `cd ${projectDirectory} && mkdir assets && cd assets && mkdir icons && mkdir images && mkdir fonts && mkdir videos && mkdir audios`,
    (error, stdout) => {
      if (error) console.error(`error: ${error}`);
    }
  );
  console.log("\n \033[35m lib folders added Successful \033[34m ");
  exec(
    `cd ${projectDirectory}/lib && mkdir api_manger && mkdir components && mkdir screens && mkdir styles && mkdir utils && mkdir language && touch .env.dart`,
    (error, stdout) => {
      if (error) console.error(`error: ${error}`);
    }
  );
  createApiManger();
};

const createApiManger = () => {
  console.log("\n \033[35m ApiManger files added Successful \033[34m ");
  exec(
    `cd ${projectDirectory}/lib/api_manger && touch ApiRequest.dart && touch index.dart && touch UrlRoutes.dart`,
    (error, stdout) => {
      if (error) console.error(`error: ${error}`);
      fs.appendFile(
        `${projectDirectory}/lib/api_manger/ApiRequest.dart`,
        apiRequestFileContent,
        (err) => {
          if (err) console.log(err);
        }
      );

      fs.appendFile(
        `${projectDirectory}/lib/api_manger/index.dart`,
        apiManagerIndex,
        (err) => {
          if (err) console.log(err);
        }
      );

      var logger = fs.createWriteStream(
        `${projectDirectory}/lib/api_manger/UrlRoutes.dart`,
        {
          flags: "a", // 'a' means appending (old data will be preserved)
        }
      );

      logger.write(`import './index.dart'; \n`);

      logger.write("\n");
      fileValue[API_ROUTES].map((value) => {
        let urlName = value.charAt(0) === "/" ? value.replace("/", "") : value;
        urlName =
          urlName.charAt(urlName.length - 1) === "/"
            ? urlName.replace(/\//, "")
            : urlName;
        urlName = urlName.toUpperCase().replace(/\//g, "_");
        logger.write(`const ${urlName} = '${value}';\n`);
      });
      logger.end();
      console.log("\n \033[35m Api Manager Added Successful $_$ \033[34m ");

      createScreens();
    }
  );
};

const createScreens = () => {
  exec(
    `cd ${projectDirectory}/lib/screens && touch index.dart`,
    (error, stdout) => {
      if (error) console.error(`error: ${error}`);
    }
  );
  var logger = fs.createWriteStream(
    `${projectDirectory}/lib/screens/index.dart`,
    {
      flags: "a", // 'a' means appending (old data will be preserved)
    }
  );

  logger.write(`export 'package:get/get.dart';\n\n`);
  logger.write(`export '../utils/index.dart';\n`);

  fileValue[SCREENS].map((value, index) => {
    const upperCaseScreenName = value.charAt(0).toUpperCase() + value.slice(1);
    exec(
      `cd ${projectDirectory}/lib/screens && mkdir ${value} && cd ${value} && touch ${upperCaseScreenName}.dart && touch ${upperCaseScreenName}Controller.dart && touch index.dart`,
      (error, stdout) => {
        if (error) console.error(`error: ${error}`);
        logger.write(`export './${value}/index.dart';\n`);

        fs.appendFile(
          `${projectDirectory}/lib/screens/${value}/index.dart`,
          screenIndexContent(
            `${upperCaseScreenName}Controller.dart`,
            `${upperCaseScreenName}.dart`
          ),
          (err) => {
            if (error) console.log(err);
          }
        );
        fs.appendFile(
          `${projectDirectory}/lib/screens/${value}/${upperCaseScreenName}Controller.dart`,
          screenControllerContent(`${upperCaseScreenName}Controller`),
          (err) => {
            if (error) console.log(err);
          }
        );

        fs.appendFile(
          `${projectDirectory}/lib/screens/${value}/${upperCaseScreenName}.dart`,
          screenContent(
            `${upperCaseScreenName}Controller`,
            upperCaseScreenName
          ),
          (err) => {
            if (error) console.log(err);
          }
        );
      }
    );
  });

  console.log("\n \033[35m Screens Added Successful $_$ \033[34m ");
  creatUtilsFiles();
};

const creatUtilsFiles = () => {

  exec(
    `cd ${projectDirectory}/lib/utils && touch index.dart`,
    (error, stdout) => {
      if (error) console.error(`error: ${error}`);
    }
  );
  createStyles();
};

const createStyles = () => {

  exec(
    `cd ${projectDirectory}/lib/utils && touch index.dart`,
    (error, stdout) => {
      if (error) console.error(`error: ${error}`);
    }
  );

  setTimeout(installPackages, 1000);
};
const installPackages = () => {
  packagesToInstall.map((command) => {
    exec(`cd ${projectDirectory} && ${command}`, (error, stdout) => {
      if (error) console.error(`error: ${error}`);
      console.log(stdout);
    });
  });
  console.log("\n \033[35m Installed Packages done Successful $_$ \033[34m ");
};

askUserToEnterFileName();

// # Text Colors
// # Black        0;30     Dark Gray     1;30
// # Red          0;31     Light Red     1;31
// # Green        0;32     Light Green   1;32
// # Brown/Orange 0;33     Yellow        1;33
// # Blue         0;34     Light Blue    1;34
// # Purple       0;35     Light Purple  1;35
// # Cyan         0;36     Light Cyan    1;36
// # Light Gray   0;37     White         1;37
