# Booking accommodation for ETHRio on-chain

Brought to you by Winding Tree.

## Contract Address

`0x0000000000000000000000000000000000000000`

## Project Goal

The goal of this project is to allow lodging providers (hotels, individual apartment owners, etc.) to allow booking of ther properties directly, without any intermediaries.

## Workflow

1. A lodging facility (hotel, hostel, etc.) owner registers one (or more) of their facilities with the smart contract
1. Then they add details of their accommodation options, e.g. hotel room types
1. Once the have done that, their inventory is now available for searching and booking, so, someone sends the requireed amount of xDai to the smart contract and...
1. ...books a room. In return they receive a Stay NFT, which has information about the hotel, the room they booked, etc.
1. The amount sent is now locked in a special escrow module of the smart contract, and will not be fully available to the hotel until the check-out.
1. At the same time, the guest is able to cancel the reservation any time before check in, and get 100% of their money back.
1. The guest may also modify their reservation at any time, paying an additional fee if required, or getting a refund, if booken fewer days/rooms. In this case their Stay NFT is modified accordingly.
1. On check in day, guest or hotel may initiate the check-in process, but in either case, the other party has to confirm, and when that happens, their Stay NFT status changes accordingly, and the amount of xDai for the first day of their stay (with a % going to Ukraine DAO automatically)
1. At this point the guest is not able to cancel or modify the reservation (this is an MVP!), the Stay NFT becomes soulbound (not transferable)
1. On the check out day, the hotel owner is able to claim the rest of the amount from the escrow (and, again, a % would go to Ukraine DAO). This action also mints a certain number of WIN tokens (1 xDai = 1 WIN) which are given to the Stay NFT holder.
1. At any point, the holder of Stay NFT is able to leave a review.
1. All the Stay NFTs booked via this smart contract are able to mint a unique set of NFTs from the local artists

# User Stories

The assumption here is that all the actors below are logged in to the ecosystem using their Ethereum wallet, and that they're on Gnosis Chain. Stories marked with "*" are not required for the MVP.

## Facility Owner User Stories

### Facility Management

As a Facility Owner or Manager, I should be able to:

- register my Lodging Facility (LF) with the Stays smart contracts
- modify any of my LF details
- deactivate my LF
- unregister (remove) my LF
- add a Space (room type) to my LF
- modify any of the Space details
- deactivate a Space
- remove a Space
- authorize an EOA to be able to manage reservations (view, check in, check out)
- view the amount of xDai currently in escrow
- view the amount of xDai claimable from escrow (and a breakdown of how it will be increasing day by day)
- claim xDai from escrow
- answer a review*
- start a dispute around a review*
- leave a review for the guest*

### Reservation Management

As a user authorized to manage rezervations, I should be able to:

- view all the reservations
- view details of any reservation, including guest contact information
- on check-in day (or any other day within the Stay range), initiate or confirm check-in

### Stay Management

TODO after MVP

### Loalty Program*

TODO

## Guest User Stories

As a traveler, I should be able to:

### Before Booking

- view all the LFs in the area
- view details of any AP, including their Space information, prices, and reviews
- book any Space, if it's available, by sending a required amount of xDai

### Before Check In

- view all my reservations
- view my
- on check-in day (or any other day within the Stay range), initiate or confirm check-in
- leave a review

### During the Stay

- leave a review
- ...

### After Check Out

- leave a review
- start a dispute on a review*

# Stays Data Management

Here's a breakdown of on-/off-chain data.

TODO

