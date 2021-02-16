# Construction

```
         B_______c_______A
          \beta  | alpha/
           \     |     /
            \    |h   /
            a\   |   /b
              \  |  /
               \ | /
                \|/ <- gamma
                 C

```

## edges

- c will never change.
- The length of a and b can be controlled with the stepper motor
- One turn will lenghten/shorten them by the circumference of the
  cylinder on the motor

## points

- `B` and `A` will never change
- `C` is dynamic, but known at the start

## angles

- `alpha`, `beta` and `gamma` are all changing as soon as one motor is
  turning
