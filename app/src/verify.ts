import axios from "axios";
import { ProofData } from "@aztec/bb.js";
import { WORD_LENGTH } from "./components/Hangman";

export const verifyProof = async (
  proof: ProofData,
  vk: Uint8Array,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; status: string }> => {
  const API_URL = "https://relayer-api.horizenlabs.io/api/v1";
  const API_KEY = import.meta.env.VITE_HORIZEN_API_KEY;

  if (!API_KEY) {
    throw new Error("HORIZEN_API_KEY environment variable is not set");
  }

  const proofUint8 = new Uint8Array(Object.values(proof.proof));

  let p2 = Buffer.from(
    concatenatePublicInputsAndProof(proof.publicInputs, proofUint8)
  ).toString("base64");

  let basedVk = Buffer.from(vk).toString("base64");

  const params = {
    proofType: "ultraplonk",
    vkRegistered: false,
    proofOptions: {
      numberOfPublicInputs: WORD_LENGTH,
    },
    proofData: {
      proof: p2,
      vk: basedVk,
    },
  };

  onStatusUpdate?.("Submitting proof for verification...");
  const verificationResponse = await axios.post(
    `${API_URL}/submit-proof/${API_KEY}`,
    params
  );

  onStatusUpdate?.("Proof submitted. Waiting for verification...");

  // Check status a few times with delays
  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds

    const jobStatusResponse = await axios.get(
      `${API_URL}/job-status/${API_KEY}/${verificationResponse.data.jobId}`
    );

    const status = jobStatusResponse.data.status;
    onStatusUpdate?.(`Verification status: ${status}`);

    if (status === "Finalized") {
      console.log("Job finalized");
      return { success: true, status: "Verification complete!" };
    } else if (status === "Failed") {
      return { success: false, status: "Verification failed" };
    }
  }

  return { success: false, status: "Verification timeout" };
};

function hexToUint8Array(hex: any) {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  if (hex.length % 2 !== 0) hex = "0" + hex;

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function concatenatePublicInputsAndProof(
  publicInputsHex: any,
  proofUint8: any
) {
  const publicInputBytesArray = publicInputsHex.flatMap((hex: any) =>
    Array.from(hexToUint8Array(hex))
  );

  const publicInputBytes = new Uint8Array(publicInputBytesArray);

  const newProof = new Uint8Array(publicInputBytes.length + proofUint8.length);
  newProof.set(publicInputBytes, 0);
  newProof.set(proofUint8, publicInputBytes.length);

  return newProof;
}
