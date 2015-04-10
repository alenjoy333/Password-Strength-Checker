/*   

Copyright (c) 2015 alenjoy333

The following license applies to all parts of this software except as
documented below:


==========

  The MIT License (MIT)

Copyright (c) 2015 alenjoy333

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

==========

Plugin  : password-strength-checker-1.0
version : 1.0
Author  : Alen Joy
Twitter : @alenjoy333
Email   : alenjoy333@gmail.com


*/












(function ( $ ) {

   var passwordChecker=function(){
          var passwordCheckerMethods ={};
          passwordCheckerMethods.passwordBox;
          passwordCheckerMethods.commonPasswords=[];
          passwordCheckerMethods.password="";
          passwordCheckerMethods.passwordCharcters="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/*-+,./;][=`-)(*&^%$#@!~?><:}{|";

          passwordCheckerMethods.initialize=function(that){
            passwordCheckerMethods.passwordBox=that;
                passwordCheckerMethods.getCommonPassowrds();
          };

          passwordCheckerMethods.destroy=function(){
            $(".pass-icon").remove();
            $(passwordCheckerMethods.passwordBox).unbind("blur");
          }

          passwordCheckerMethods.checkIfThePasswordIsTooCommon=function()
          {
                return $.inArray($(passwordCheckerMethods.passwordBox).val(),passwordCheckerMethods.commonPasswords);
          };

          passwordCheckerMethods.getCommonPassowrds =function()
          {

             $.getJSON("data/10kPass.json",function(data){
                passwordCheckerMethods.commonPasswords =data;
                passwordCheckerMethods.setEvents();
             });

           };


           passwordCheckerMethods.setEvents=function(){
             $(passwordCheckerMethods.passwordBox).on("blur",function(){
               if( $(passwordCheckerMethods.passwordBox).val() !="")
               {
                var html = passwordCheckerMethods.getEmotions(passwordCheckerMethods.checkIfThePasswordIsTooCommon());
                $(".pass-icon").remove();
                $(passwordCheckerMethods.passwordBox).after(html);
               }
             });
           };

           passwordCheckerMethods.getEmotions=function(passwordType){

               var html="";
               var strength=0;

               if(passwordType  !== -1)
               {
                  html= "<div class='pass-icon'><i class='too-common '></i>Password is too common!!! <i class='key-gen' title='Generate Password'></i></div>";
               }
               else{
                strength=passwordCheckerMethods.checkPasswordStrength($(passwordCheckerMethods.passwordBox).val());
                 switch(strength)
                 {
                   case 0:
                         html=  "<div class='pass-icon'><i class='medium-pass'></i> It's just ok!!! <i class='key-gen' title='Generate Password'></i></div>";
                         break;
                   case 1:
                         html=  "<div class='pass-icon'><i class='great-pass'></i> Awesome!!!</div>";

                         break;
                  default:
                        html=  "<div class='pass-icon'><i class='too-week pass-icon'></i> You are kidding right??? <i class='key-gen' title='Generate Password'></i></div>";
                         break;
                 }

               }

               if(strength !=1)
               {
                window.setTimeout(function(){
                   passwordCheckerMethods.setKeyGenEvent();
                },250);
               }
               return html;
           };
         
         passwordCheckerMethods.checkPasswordStrength =function(password)
         {

            var strength=0;
             //check is the passowrd contain any number
                if(/\d+/g.test(password) == true)
                 strength++;
            //check is the password contain any special characters
               if(/[^\w\s]/gi.test(password) == true)
                strength++;
            // check is the password contain capital and small letters 
              if(/[a-z]/.test(password)== true &&  /[A-Z]/.test(password)== true)
                strength++;
            // check is the password lengthy greatter than 8
            if(password.length>8)
                 strength++;

            if(strength ==4)
            {
              return 1;
            }
            else if(strength ==3)
            {
              return 0;
            }
            return 2;
         };

         passwordCheckerMethods.setKeyGenEvent =function(){
            $(".key-gen").on("click",function(){
               passwordCheckerMethods.generatePassword();
            });
         };

         passwordCheckerMethods.generatePassword =function(){
          var password="";
            for(var i=0;i<10;i++)
            {
               password+=passwordCheckerMethods.passwordCharcters.charAt(Math.floor(Math.random() * passwordCheckerMethods.passwordCharcters.length))
            }
            if(passwordCheckerMethods.checkPasswordStrength(password) != 1)
              passwordCheckerMethods.generatePassword();

            var confirmedPassword =prompt("Do you like this", password);

            if(confirmedPassword==null)
            {
               var needAnotherPassword =confirm("Do you want to generate another password ???");
               if(needAnotherPassword)
                passwordCheckerMethods.generatePassword();
            }
            else{
                $(passwordCheckerMethods.passwordBox).val(confirmedPassword);
            }
         };
        return passwordCheckerMethods;
     }();
 
$.fn.checkPassword=function(type){
  if(type !="destroy")
  {
   passwordChecker.initialize(this);
 }
 else{
  passwordChecker.destroy();
 }

};
 
}( jQuery ));


