import { zkVerifySession, ZkVerifyEvents } from "zkverifyjs";
import fs from "fs";

const bufvk = fs.readFileSync("../circuit/target/vk");
const bufproof = fs.readFileSync("../circuit/target/proof");
const base64Proof = bufproof.toString("base64");
const base64Vk = bufvk.toString("base64");

const session = await zkVerifySession.start().Volta().withAccount("redacted");

// FIXME: Can't declare this since events is redeclared later
//const {events} = await session.registerVerificationKey().ultraplonk({numberOfPublicInputs:2}).execute(base64Vk);

const vkey = fs.readFileSync("./vkey.json"); //Importing the registered vkhash
let statement;

session.subscribe([
  {
    event: ZkVerifyEvents.NewAggregationReceipt,
    callback: async (eventData) => {
      console.log("New aggregation receipt:", eventData);
      let statementpath = await session.getAggregateStatementPath(
        eventData.blockHash,
        parseInt(eventData.data.domainId),
        parseInt(eventData.data.aggregationId),
        statement
      );
      console.log("Statement path:", statementpath);
      const statementproof = {
        ...statementpath,
        domainId: parseInt(eventData.data.domainId),
        aggregationId: parseInt(eventData.data.aggregationId),
      };
      fs.writeFile("aggregation.json", JSON.stringify(statementproof));
    },
    options: { domainId: 0 },
  },
]);

const { events } = await session
  .verify()
  .ultraplonk({ numberOfPublicInputs: 1 }) // Make sure to replace the numberOfPublicInputs field as per your circuit
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
});
