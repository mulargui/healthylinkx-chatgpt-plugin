#!/bin/bash

# testing api
URL=https://x73rkqly3c.execute-api.us-east-1.amazonaws.com/prod/providers

test () {     
    date +"%T.%3N"
    ECHO $1
    curl -L -H 'Content-Type: application/json' "$URL?$1" ; echo
}

# testing params
test "zipcode=98052"
test "zipcode=98052&distance=10" 
test "lastname1=anderson" 
test "lastname1=anderson&lastname2=brock" 
test "lastname1=anderson&lastname2=brock&lastname3=tang-xue" 
test "specialty=Dentist"

test "zipcode=98052&lastname1=anderson" 
test "zipcode=98052&lastname1=anderson&gender=f"
test "zipcode=98052&lastname1=anderson&gender=f&specialty=Counselor"

test "zipcode=98052&distance=10&lastname1=anderson&lastname2=brock&lastname3=tang-xue&gender=f&specialty=Counselor"

#empty result
test "zipcode=98052&distance=10&lastname1=anderson&lastname2=brock&lastname3=tang-xue&gender=f&specialty=Dentist"

#insuficient params
test "gender=m"
