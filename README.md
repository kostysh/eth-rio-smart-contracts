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