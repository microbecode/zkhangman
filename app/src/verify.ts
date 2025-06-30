import { zkVerifySession, ZkVerifyEvents, WalletOptions } from "zkverifyjs";
import fs from "fs";
import vkey from "./vkey.json";
import axios from "axios";

//const bufvk = fs.readFileSync("../vkey.json");
/* const bufproof = fs.readFileSync("../circuit/target/proof");
const base64Proof = bufproof.toString("base64");
const base64Vk = bufvk.toString("base64"); */

/* let wallet: WalletOptions = {
  accountAddress: "0x0000000000000000000000000000000000000000",
  source,
}; */

export const verifyProof = async (proof: Uint8Array, vk: Uint8Array) => {
  const API_URL = "https://relayer-api.horizenlabs.io/api/v1";
  const API_KEY = import.meta.env.VITE_HORIZEN_API_KEY;

  if (!API_KEY) {
    throw new Error("HORIZEN_API_KEY environment variable is not set");
  }

  const bufvk = vk;
  const base64Proof = proof.toString("base64");
  const base64Vk = bufvk.toString("base64");

  const params = {
    proofType: "ultraplonk",
    vkRegistered: false,
    proofOptions: {
      numberOfPublicInputs: 4,
    },
    proofData: {
      proof: base64Proof,
      vk: base64Vk,
    },
  };

  const requestResponse = await axios.post(
    `${API_URL}/submit-proof/${API_KEY}`,
    params
  );
  console.log(requestResponse.data);

  /* const session = await zkVerifySession.start().Volta();


  console.log("vkey", vkey);


  let statement, aggregationId: number;

  session.subscribe([
    {
      event: ZkVerifyEvents.NewAggregationReceipt,
      callback: async (eventData) => {
        console.log("New aggregation receipt:", eventData);
        if (
          aggregationId ==
          parseInt(eventData.data.aggregationId.replace(/,/g, ""))
        ) {
          let statementpath = await session.getAggregateStatementPath(
            eventData.blockHash,
            parseInt(eventData.data.domainId),
            parseInt(eventData.data.aggregationId.replace(/,/g, "")),
            statement
          );
          console.log("Statement path:", statementpath);
          const statementproof = {
            ...statementpath,
            domainId: parseInt(eventData.data.domainId),
            aggregationId: parseInt(eventData.data.aggregationId),
          };
          fs.writeFileSync("aggregation.json", JSON.stringify(statementproof));
        }
      },
      options: { domainId: 0 },
    },
  ]);

  const { events } = await session
    .verify()
    .ultraplonk({ numberOfPublicInputs: 4 }) // Make sure to replace the numberOfPublicInputs field as per your circuit
    .withRegisteredVk()
    .execute({
      proofData: {
        vk: vkey.hash,
        proof: base64Proof,
      },
      domainId: 0,
    });

  events.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
    console.log("Included in block", eventData);
    statement = eventData.statement;
    aggregationId = eventData.aggregationId;
  }); */
};

/* 
const session = await zkVerifySession
  .start()
  .Volta()
  .withAccount(
    "word slim pencil rough stove mandate umbrella worry solution feature inhale regret"
  );

// FIXME: Can't declare this since events is redeclared later
//const {events} = await session.registerVerificationKey().ultraplonk({numberOfPublicInputs:2}).execute(base64Vk);

const vkey = fs.readFileSync("./vkey.json"); //Importing the registered vkhash
let statement, aggregationId;

session.subscribe([
  {
    event: ZkVerifyEvents.NewAggregationReceipt,
    callback: async (eventData) => {
      console.log("New aggregation receipt:", eventData);
      if (
        aggregationId ==
        parseInt(eventData.data.aggregationId.replace(/,/g, ""))
      ) {
        let statementpath = await session.getAggregateStatementPath(
          eventData.blockHash,
          parseInt(eventData.data.domainId),
          parseInt(eventData.data.aggregationId.replace(/,/g, "")),
          statement
        );
        console.log("Statement path:", statementpath);
        const statementproof = {
          ...statementpath,
          domainId: parseInt(eventData.data.domainId),
          aggregationId: parseInt(eventData.data.aggregationId),
        };
        fs.writeFileSync("aggregation.json", JSON.stringify(statementproof));
      }
    },
    options: { domainId: 0 },
  },
]);

const { events } = await session
  .verify()
  .ultraplonk({ numberOfPublicInputs: 4 }) // Make sure to replace the numberOfPublicInputs field as per your circuit
  .withRegisteredVk()
  .execute({
    proofData: {
      vk: JSON.parse(vkey).hash,
      proof: base64Proof,
    },
    domainId: 0,
  });

events.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
  console.log("Included in block", eventData);
  statement = eventData.statement;
  aggregationId = eventData.aggregationId;
});
 */
