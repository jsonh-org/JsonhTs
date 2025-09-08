:: Prevent quit on error
if not defined in_subprocess (cmd /k set in_subprocess=y ^& %0 %*) & exit
:: Clear screen
cls

:: Test
cd jsonh-ts-tests
npm test