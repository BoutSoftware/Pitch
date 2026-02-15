import { Storage } from "@google-cloud/storage";
import { GCP_BUCKET, GCP_CLIENT_EMAIL, GCP_PRIVATE_KEY, GCP_PROJECT_ID } from "@/configs";

export const gcpStorage = new Storage({
    projectId: GCP_PROJECT_ID,
    credentials: {
        private_key: GCP_PRIVATE_KEY,
        client_email: GCP_CLIENT_EMAIL
    }
});
export const gcpBucket = gcpStorage.bucket(GCP_BUCKET);