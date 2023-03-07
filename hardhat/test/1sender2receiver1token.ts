import { ethers } from "hardhat";
const { utils } = ethers;
import { expect } from "chai";
import { TokenA, Forwarder, ForwarderDatatype } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import createPaymentInput from "../utils/createPaymentInput";

let Token, token: TokenA, Forwarder, forwarder: Forwarder;

let deployer: SignerWithAddress,
  sender1: SignerWithAddress,
  sender2: SignerWithAddress,
  relayer: SignerWithAddress,
  receiver1: SignerWithAddress,
  receiver2: SignerWithAddress;

describe("One sender two receiver one token", () => {
  before(async () => {
    [deployer, sender1, sender2, relayer, receiver1, receiver2] =
      await ethers.getSigners();

    Token = await ethers.getContractFactory("TokenA");
    token = await Token.deploy();
    await token.deployed();

    Forwarder = await ethers.getContractFactory("Forwarder");
    forwarder = await Forwarder.deploy();
    await forwarder.deployed();
  });

  describe("sending the transaction", async () => {
    // Payer is paying 10 tokens
    it("should be able to relay the payments", async () => {
      await token.mint(sender1.address, utils.parseEther("50"));

      let paymentInputs: any[] = [];

      const value1 = utils.parseEther("10");
      const deadline = ethers.constants.MaxUint256;
      const paymentInput1 = await createPaymentInput(
        sender1,
        receiver1,
        token,
        forwarder,
        value1,
        deadline,
        paymentInputs
      );

      paymentInputs.push(paymentInput1);

      const value2 = utils.parseEther("20");

      const paymentInput2 = await createPaymentInput(
        sender1,
        receiver2,
        token,
        forwarder,
        value2,
        deadline,
        paymentInputs
      );

      paymentInputs.push(paymentInput2);

      await forwarder.connect(relayer).payViaSignature(paymentInputs);

      expect(await token.balanceOf(sender1.address)).to.be.eq(
        utils.parseEther("20")
      );

      expect(await token.balanceOf(receiver1.address)).to.be.eq(
        utils.parseEther("10")
      );

      expect(await token.balanceOf(receiver2.address)).to.be.eq(
        utils.parseEther("20")
      );
    });
  });
});
