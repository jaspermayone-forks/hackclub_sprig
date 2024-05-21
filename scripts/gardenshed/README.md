## Alias configuration

Shell users should add the following to their terminal startup scripts, such as `.zprofile` on mac or `.bash-rc` on ubuntu: 
```
export SPRIG_DIR=/home/shawn/Sauce/sprig/ #replace with directory of your sprig repo
alias spade="cd $SPRIG_DIR/firmware/spade"
alias gardenshed="python3 $SPRIG_DIR/scripts/gardenshed/gardenshed.py"
alias gs="python3 $SPRIG_DIR/scripts/gardenshed/gardenshed.py"
```

