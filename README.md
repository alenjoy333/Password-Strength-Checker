# Password-Strength-Checker
Password-Strength-Checker is a simple jquery plugin for measuring the strength of a password. When user types a password the plugin  will  check it with  10000 common passwords and if the user's password is a common password it will inform the user . The plugin is also capable  for creating strong passwords if the user needs one.
 

 Usage

 you can initialize the monitoring using monitorPassword();

 eg: $("#txtPassword").monitorPassword();


 To deactivate monitoring pass "destroy" as argument

 $("#txtPassword").monitorPassword("destroy");
