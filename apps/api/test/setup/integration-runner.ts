import { VitestTestRunner } from "vitest/runners";
import { disconnectTestDatabase } from "./database.js";

export default class IntegrationTestRunner extends VitestTestRunner {
  override async onAfterRunFiles() {
    super.onAfterRunFiles();
    await disconnectTestDatabase();
  }
}
