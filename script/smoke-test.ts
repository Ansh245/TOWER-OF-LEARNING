/**
 * Smoke test for authentication endpoints.
 * Runs register and login tests to validate the API is working.
 * Exit code 0 = success, 1 = failure.
 */

const API_URL = process.env.API_URL || "http://localhost:5000";
const TEST_EMAIL = `smoke-test-${Date.now()}@example.com`;
const TEST_PASSWORD = "testpass123";
const TEST_DISPLAY_NAME = "SmokeTest";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testRegister(): Promise<boolean> {
  console.log(`\n🚀 Testing POST ${API_URL}/api/auth/register`);
  console.log(`   Email: ${TEST_EMAIL}`);
  console.log(`   Password: ${TEST_PASSWORD}`);

  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        displayName: TEST_DISPLAY_NAME,
        role: "student",
        password: TEST_PASSWORD,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`   ❌ Register failed with status ${response.status}:`, data);
      return false;
    }

    if (!data.id || !data.passwordHash) {
      console.error(`   ❌ Register response missing required fields:`, data);
      return false;
    }

    console.log(`   ✅ Register succeeded. User ID: ${data.id}`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Register error:`, error.message);
    return false;
  }
}

async function testLogin(): Promise<boolean> {
  console.log(`\n🔐 Testing POST ${API_URL}/api/auth/login`);
  console.log(`   Email: ${TEST_EMAIL}`);
  console.log(`   Password: ${TEST_PASSWORD}`);

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`   ❌ Login failed with status ${response.status}:`, data);
      return false;
    }

    if (!data.id || data.email !== TEST_EMAIL) {
      console.error(`   ❌ Login response missing required fields or incorrect email:`, data);
      return false;
    }

    console.log(`   ✅ Login succeeded. Logged in as: ${data.email}`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Login error:`, error.message);
    return false;
  }
}

async function main() {
  console.log("===============================================");
  console.log("🧪 Auth Endpoints Smoke Test");
  console.log("===============================================");
  console.log(`API URL: ${API_URL}`);
  console.log(`Test Timestamp: ${new Date().toISOString()}`);

  // Wait a moment to ensure server is ready
  await sleep(1000);

  const registerSuccess = await testRegister();
  const loginSuccess = await testLogin();

  console.log("\n===============================================");
  if (registerSuccess && loginSuccess) {
    console.log("✅ All smoke tests passed!");
    console.log("===============================================\n");
    process.exit(0);
  } else {
    console.log("❌ Some smoke tests failed.");
    console.log("===============================================\n");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
