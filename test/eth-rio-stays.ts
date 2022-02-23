import { expect } from "./utils/chai-setup"
import { ethers, deployments, getUnnamedAccounts, getNamedAccounts, waffle, hardhatArguments } from "hardhat"
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
  let users: ({ address: string; } & { ethRioStays: EthRioStays })[]
  let deployer: { address: string; } & { ethRioStays: EthRioStays }
  let alice: { address: string; } & { ethRioStays: EthRioStays }
  let bob: { address: string; } & { ethRioStays: EthRioStays }

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
    const testDataUri = 'https://some.uri'

    beforeEach(async () => {
      await alice.ethRioStays.registerLodgingFacility(testDataUri)
    })

    it("should have created facility with correct parameters", async () => {
      const facilityId = (await alice.ethRioStays.getMyLodgingFacilityIds())[0]
      const f = await alice.ethRioStays.lodgingFacilities(facilityId)

      expect(f.owner).to.equal(alice.address)
      expect(f.dataURI).to.equal(testDataUri)
      expect(f.exists).to.be.true
    })

    it("should emit LodgingFacilityCreated with the index of the added facility", async () => {
      let newId;
      const promise = bob.ethRioStays.registerLodgingFacility(testDataUri)
      promise.then(async () => {
        const facilityId = (await bob.ethRioStays.getMyLodgingFacilityIds())[0]
        newId = await bob.ethRioStays.lodgingFacilities(facilityId)

        await expect(promise)
          .to.emit(bob.ethRioStays, "LodgingFacilityCreated")
          .withArgs(newId, bob.address, testDataUri)
      });
    })

    it("should revert if no URI provided", async () => {
      await expect(
        alice.ethRioStays.registerLodgingFacility('')
      ).to.be.revertedWith("Data URI must be provided")
    })

    it("should revert if facility with the same owner/dataURI already exists", async () => {
      await expect(
        alice.ethRioStays.registerLodgingFacility(testDataUri)
      ).to.be.revertedWith("Facility already exists")
    })
  })

  describe("getAllLodgingFacilityIds()", () => {
    const testDataUri = 'https://some.uri'

    beforeEach(async () => {
      await alice.ethRioStays.registerLodgingFacility(testDataUri)
      await alice.ethRioStays.registerLodgingFacility(testDataUri + 'bla')
      await bob.ethRioStays.registerLodgingFacility(testDataUri)
    })

    it("should return an array of all loding facility Ids", async () => {
      expect(await deployer.ethRioStays.getAllLodgingFacilityIds()).to.be.of.length(3)
    })
  })

  describe("getMyLodgingFacilities()", () => {
    const testDataUri = 'https://some.uri'

    beforeEach(async () => {
      await alice.ethRioStays.registerLodgingFacility(testDataUri)
      await alice.ethRioStays.registerLodgingFacility(testDataUri + 'bla')
    })

    it("should return an array of Alice's loding facility Ids", async () => {
      expect(await alice.ethRioStays.getMyLodgingFacilityIds()).to.be.of.length(2)
    })
  })

  describe("addSpace()", () => {
    const anUri = 'https://some_other.uri'
    let facilityId: BytesLike

    beforeEach(async () => {
      await alice.ethRioStays.registerLodgingFacility(anUri)
      facilityId = (await alice.ethRioStays.getMyLodgingFacilityIds())[0]
    })

    it("should revert if non-owner tries to add a Space", async () => {
      await expect(
        bob.ethRioStays.addSpace(facilityId, 1, 2, true, anUri)
      ).to.be.revertedWith("Only facility owner may add Spaces")
    })

    it("should revert if trying to add a Space to non-existing facility", async () => {
      await expect(
        alice.ethRioStays.addSpace("0x0000000000000000000000000000000000000000000000000000000000000001", 1, 2, true, anUri)
      ).to.be.revertedWith("Facility does not exist")
    })

    it("should add a Space with correct parameters", async () => {
      await alice.ethRioStays.addSpace(facilityId, 1, 2, true, anUri)
      const aliceSpaces = await alice.ethRioStays.getSpacesByFacilityId(facilityId)

      expect(aliceSpaces).to.be.of.length(1)
      expect(aliceSpaces[0].quantity).to.equal(1)
      expect(aliceSpaces[0].pricePerNightWei).to.equal(2)
      expect(aliceSpaces[0].active).to.be.true
      expect(aliceSpaces[0].dataURI).to.equal(anUri)
    })

    it("should emit SpaceAdded with correct params", async () => {
      await expect(alice.ethRioStays.addSpace(facilityId, 1, 2, true, anUri))
        .to.emit(alice.ethRioStays, "SpaceAdded")
        .withArgs(facilityId, 1, 2, true, anUri)
    })
  })
})