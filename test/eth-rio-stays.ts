import { expect } from "./utils/chai-setup"
import { ethers, deployments, getUnnamedAccounts, getNamedAccounts, waffle, hardhatArguments, network } from "hardhat"
import { BytesLike, utils } from "ethers"

import { EthRioStays } from "../typechain"
import { setupUser, setupUsers } from "./utils"

const setup = deployments.createFixture(async () => {
  await deployments.fixture("EthRioStays")
  const { deployer, alice, bob } = await getNamedAccounts()
  const contracts = {
    ethRioStays: <EthRioStays> await ethers.getContract("EthRioStays")
  }
  const users = await setupUsers(await getUnnamedAccounts(), contracts)

  return {
    users,
    deployer: await setupUser(deployer, contracts),
    alice: await setupUser(alice, contracts),
    bob: await setupUser(bob, contracts),
    ...contracts
  }
})

describe('EthRioStays.sol', () => {
  let users: ({ address: string } & { ethRioStays: EthRioStays })[]
  let deployer: { address: string } & { ethRioStays: EthRioStays }
  let alice: { address: string } & { ethRioStays: EthRioStays }
  let bob: { address: string } & { ethRioStays: EthRioStays }
  const testDataUri = 'https://some.uri'

  beforeEach("load fixture", async () => {
    ({ users, deployer, alice, bob } = await setup())
  })

  describe("Correct Setup", () => {
    it("should have the right name and symbol", async () => {
      expect(await deployer.ethRioStays.name()).to.be.eq("EthRioStays")
      expect(await deployer.ethRioStays.symbol()).to.be.eq("ERS22")
    })
    it("should have 0 facilities first", async () => {
      expect(await deployer.ethRioStays.getAllLodgingFacilityIds()).to.be.of.length(0)
    })
  })

  describe("registerLodgingFacility()", () => {
    beforeEach(async () => {
      await alice.ethRioStays.registerLodgingFacility(testDataUri, false)
    })

    it("should have created facility with correct parameters", async () => {
      const facilityId = (await alice.ethRioStays.getMyLodgingFacilityIds())[0]
      const f = await alice.ethRioStays.lodgingFacilities(facilityId)

      expect(f.owner).to.equal(alice.address)
      expect(f.dataURI).to.equal(testDataUri)
      expect(f.exists).to.be.true
      expect(f.active).to.be.false
    })

    it("should emit LodgingFacilityCreated with the index of the added facility", async () => {
      let newId
      const promise = bob.ethRioStays.registerLodgingFacility(testDataUri, true)
      promise.then(async () => {
        const facilityId = (await bob.ethRioStays.getMyLodgingFacilityIds())[0]
        newId = await bob.ethRioStays.lodgingFacilities(facilityId)

        await expect(promise)
          .to.emit(bob.ethRioStays, "LodgingFacilityCreated")
          .withArgs(newId, bob.address, testDataUri)
      })
    })

    it("should revert if no URI provided", async () => {
      await expect(
        alice.ethRioStays.registerLodgingFacility('', true)
      ).to.be.revertedWith("Data URI must be provided")
    })

    it("should revert if facility with the same owner/dataURI already exists", async () => {
      await expect(
        alice.ethRioStays.registerLodgingFacility(testDataUri, true)
      ).to.be.revertedWith("Facility already exists")
    })
  })

  describe("getAllLodgingFacilityIds()", () => {
    beforeEach(async () => {
      await alice.ethRioStays.registerLodgingFacility(testDataUri, true)
      await alice.ethRioStays.registerLodgingFacility(testDataUri + 'bla', true)
      await bob.ethRioStays.registerLodgingFacility(testDataUri, true)
    })

    it("should return an array of all loding facility Ids", async () => {
      expect(await deployer.ethRioStays.getAllLodgingFacilityIds()).to.be.of.length(3)
    })
  })

  describe("getMyLodgingFacilities()", () => {
    beforeEach(async () => {
      await alice.ethRioStays.registerLodgingFacility(testDataUri, true)
      await alice.ethRioStays.registerLodgingFacility(testDataUri + 'bla', true)
    })

    it("should return an array of Alice's loding facility Ids", async () => {
      expect(await alice.ethRioStays.getMyLodgingFacilityIds()).to.be.of.length(2)
    })
  })

  describe("addSpace()", () => {
    let facilityId: BytesLike

    beforeEach(async () => {
      await alice.ethRioStays.registerLodgingFacility(testDataUri, true)
      facilityId = (await alice.ethRioStays.getMyLodgingFacilityIds())[0]
    })

    it("should revert if non-owner tries to add a Space", async () => {
      await expect(
        bob.ethRioStays.addSpace(facilityId, 1, 2, true, testDataUri)
      ).to.be.revertedWith("Only facility owner may add Spaces")
    })

    it("should revert if trying to add a Space to non-existing facility", async () => {
      await expect(
        alice.ethRioStays.addSpace("0x0000000000000000000000000000000000000000000000000000000000000001", 1, 2, true, testDataUri)
      ).to.be.revertedWith("Facility does not exist")
    })

    it("should add a Space with correct parameters", async () => {
      await alice.ethRioStays.addSpace(facilityId, 1, 2, true, testDataUri)
      const spaceIds = await alice.ethRioStays.getSpaceIdsByFacilityId(facilityId)
      const space = await alice.ethRioStays.spaces(spaceIds[0])

      expect(spaceIds).to.be.of.length(1)
      expect(space.lodgingFacilityId).to.equal(facilityId)
      expect(space.capacity).to.equal(1)
      expect(space.pricePerNightWei).to.equal(2)
      expect(space.active).to.be.true
      expect(space.exists).to.be.true
      expect(space.dataURI).to.equal(testDataUri)
    })

    it("should emit SpaceAdded with correct params", async () => {
      await expect(alice.ethRioStays.addSpace(facilityId, 1, 2, true, testDataUri))
        .to.emit(alice.ethRioStays, "SpaceAdded")
        .withArgs(facilityId, 1, 2, true, testDataUri)
    })
  })

  context("availability, bookings, checkin, checkout, modifications, cancellations", async () => {
    let fid, f, sid, s

    beforeEach(async () => {
      await alice.ethRioStays.registerLodgingFacility(testDataUri, true)
      fid = (await alice.ethRioStays.getMyLodgingFacilityIds())[0]
      f = await alice.ethRioStays.lodgingFacilities(fid)

      await alice.ethRioStays.addSpace(fid, 10, 12345, true, testDataUri + "space")
      sid = (await alice.ethRioStays.getSpaceIdsByFacilityId(fid))[0]
      s = await alice.ethRioStays.spaces(sid)
    })

    describe("getAvailability()", async () => {
      it("should return correct initial values", async () => {
        expect(await alice.ethRioStays.getAvailability(sid, 100, 3)).to.deep.equal([10,10,10])
      })

      it("should return correct values", async () => {
        // Booking: spaceId, dayStart, numberOfDays, numberOfSpaces, tokenURI
        await alice.ethRioStays.bookAStay(sid, 100, 1, 5, testDataUri + "stay", { value: 1000000 })
        expect(await alice.ethRioStays.getAvailability(sid, 99, 5)).to.deep.equal([10,5,10,10,10])
        await alice.ethRioStays.bookAStay(sid, 101, 2, 3, testDataUri + "stay", { value: 1000000 })
        expect(await alice.ethRioStays.getAvailability(sid, 99, 5)).to.deep.equal([10,5,7,7,10])
        await alice.ethRioStays.bookAStay(sid, 102, 1, 1, testDataUri + "stay", { value: 1000000 })
        expect(await alice.ethRioStays.getAvailability(sid, 99, 5)).to.deep.equal([10,5,7,6,10])
        await alice.ethRioStays.bookAStay(sid, 99, 2, 2, testDataUri + "stay", { value: 1000000 })
        expect(await alice.ethRioStays.getAvailability(sid, 99, 5)).to.deep.equal([8,3,7,6,10])
        await alice.ethRioStays.bookAStay(sid, 99, 5, 3, testDataUri + "stay", { value: 1000000 })
        expect(await alice.ethRioStays.getAvailability(sid, 99, 5)).to.deep.equal([5,0,4,3,7])
      })
    })

    describe("bookAStay()", async () => {
      it("should revert if payment is less than what's required", async () => {
        await expect(
          alice.ethRioStays.bookAStay(sid, 42, 1, 1, testDataUri + "stay", { value: 12344 })
        ).to.be.revertedWith("Need. More. Money!")
        await expect(
          alice.ethRioStays.bookAStay(sid, 42, 2, 5, testDataUri + "stay", { value: 123449 })
        ).to.be.revertedWith("Need. More. Money!")
      })

      it("should revert if trying to book for further than one day in the past", async () => {
        const dayZero = (await alice.ethRioStays.dayZero())
        const now = Math.floor((+ new Date()) / 1000)
        const testDay = Math.floor((now - dayZero) / 86400)

        // This is fine
        alice.ethRioStays.bookAStay(sid, testDay - 1, 1, 1, testDataUri + "stay", { value: 1000000 })

        // This is not
        await expect(
          alice.ethRioStays.bookAStay(sid, testDay - 2, 1, 1, testDataUri + "stay", { value: 1000000 })
        ).to.be.revertedWith("Don't stay in the past")
      })

      it("should send user a stay NFT", async () => {

      })

      it("should give the facility access to encrypted user information", async () => {

      })

      it("should send the money to the facility escrow", async () => {

      })

      it("should emit StayBooked", async () => {
        const promise = alice.ethRioStays.bookAStay(sid, 100, 1, 1, testDataUri + "stay", { value: 1000000 })
        promise.then(async (tid) => {
          await expect(promise)
            .to.emit(alice.ethRioStays, "StayBooked")
            .withArgs(sid, tid)
        })
      })
    })
  })

  describe("modifications, cancellations", async () => {
    describe("modifyStay()", async () => {
      it("should revert if there is no availability", async () => {

      })

      it("should revert if payment is not provided", async () => {

      })

      it("should modify the Stay", async () => {

      })

      it("should divert a % to UkraineDAO", async () => {

      })

      it("should emit...", async () => {

      })
    })

    describe("cancelStay()", async () => {
      it("should send remaining escrow amount to the facility address", async () => {

      })

      it("should divert a % to UkraineDAO", async () => {

      })

      it("should emit...", async () => {

      })
    })
  })

  describe("check in, check out", async () => {
    describe("checkIn()", async () => {
      it("should change Stay status to 'checked_in'", async () => {

      })

      it("should send the first day escrow amount to the facility address", async () => {

      })

      it("should divert a % to UkraineDAO", async () => {

      })

      it("should emit...", async () => {

      })
    })

    describe("checkOut()", async () => {
      it("should send remaining escrow amount to the facility address", async () => {

      })

      it("should divert a % to UkraineDAO", async () => {

      })

      it("should emit...", async () => {

      })
    })
  })
})