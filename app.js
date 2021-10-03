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

const { NAME, SCREENS, COLORS, ROUTES } = {
  NAME: "name",
  SCREENS: "screens",
  COLORS: "colors",
  ROUTES: "routes",
};

// selected file name
let filePath;

// json file value
let fileValue = {};

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
  console.log("\033[32m \nStart Create Flutter Project....");
  // create flutter project
  exec(`flutter create ${fileValue[NAME]}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(stdout);
    console.log("\033[35m Flutter Project Created Success $_$ \033[34m ");
    // create flutter pubspec.yaml
  });
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
