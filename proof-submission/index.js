import { zkVerifySession, ZkVerifyEvents } from "zkverifyjs";
import fs from "fs";
const bufvk = fs.readFileSync("../circuit/target/vk");
const bufproof = fs.readFileSync("../circuit/target/proof");
const base64Proof = bufproof.toString("base64");
const base64Vk = bufvk.toString("base64");

const session = await zkVerifySession
  .start()
  .Volta()
  .withAccount(
    "lucky drastic range dutch repeat room discover feel account base tray moment"
  );

const { events } = await session
  .registerVerificationKey()
  .ultraplonk({ numberOfPublicInputs: 1 })
  .execute(base64Vk); // Make sure to replace the numberOfPublicInputs field as per your circuit

events.on(ZkVerifyEvents.Finalized, (eventData) => {
  console.log("Registration finalized:", eventData);
  fs.writeFileSync(
    "vkey.json",
    JSON.stringify({ hash: eventData.statementHash }, null, 2)
  );
  return eventData.statementHash;
});
