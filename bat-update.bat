@echo off
call cd jsonh-ts
call npm update
call npm install
call cd ..
call cd jsonh-ts-tests
call npm update
call npm install
call cd ..
pause