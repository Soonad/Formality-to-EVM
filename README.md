# Formality-EVM

Evaluates an FM-Net graph inside the Ethereum Virtual Machine.

**ATENTION:** The FM-Net -> EVM interpreter is still under heavy testing and development phase.

## How to run the code in your environment (testing only)

#### Unix-based OS
1. Clone this repository in your machine
2. Make sure you have go-ethereum and nodejs installed
3. Modify the _code_ variable inside _main.js_ to write the code to be run. The file _tests.js_ includes examples of codes and inputs to be used in the interpreter. You can use them to have an idea of how the codes should be run.
4. Create a shell script to run your code with go-ethereum evm implmentation. This can be done by running "_node main.js > evmrun.sh_".
5. Execute the script you just created with "_./evmrun.sh_". This should generate a file called _output.txt_, which includes the debug log of your program execution.


## Future work
* Many improvements to make code cheaper to run (use less gas during execution)
* Clean code to make it easier for a human to read
* Support other platforms
* Make interpreter more intuitive to use
* Include the option to use ethereumjs instead of go-ethereum
