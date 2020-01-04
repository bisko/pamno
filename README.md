# Pamno
A NodeJS app to control and keep stats on a Greyko pellet burner through it's serial port

### Name

If you're wondering about the project name, here's a short explanation :) 

> `pamno` - [**pam**-no] - noun:
> 
> Translation from Bulgarian - central heating for the house.
> 
> Also my son's favorite thing in his grandparent's house. 

# What does the app do?

The app communicates with the pellet burner through it's RS232 port. 

# Prerequisites

* A Greyko RB-20 pellet burner. Might work on other models too, but this is the one we tested with
* A RS232 to USB converter cable
  * **_!!! Important_**: Some cables send the burner controller in a boot loop! It's important to disconnect the cable immediately if you notice the burner or its controller acting strange!
  * A fix that we found out to work was to build a small direct (pin to pin, without crossing) "extension" cable that only connects pins 2,3 and 5 (Rx, Tx, GND) on the DB9 connector. 
* A computer to run the app on. A desktop computer, a laptop or a Single-Board-Computer like Raspberry PI.
* An InfluxDB instance if you want data logging

# Running the app

TBD

# Controlling the burner

TBD
