require("dotenv").config();
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const express = require("express");
const socketHelper = require("../utils/socket");
const authRouter = require("../routes/auth");
const lostItemsRouter = require("../routes/lostItems");
const foundItemsRouter = require("../routes/foundItems");
const claimsRouter = require("../routes/claims");
const notificationsRouter = require("../routes/notifications");

// Use a separate test database
const TEST_MONGODB_URI = "mongodb://127.0.0.1:27017/campus-lost-found-test";
const TEST_PORT = 5001;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

socketHelper.init(io);
app.use(express.json({ limit: "50mb" }));
app.use("/auth", authRouter);
app.use("/lost-items", lostItemsRouter);
app.use("/found-items", foundItemsRouter);
app.use("/claims", claimsRouter);
app.use("/notifications", notificationsRouter);

async function runTests() {
  console.log("Starting backend automated integration tests...");

  // 1. Connect to DB and clear it
  await mongoose.connect(TEST_MONGODB_URI);
  console.log("Connected to test database.");
  await mongoose.connection.db.dropDatabase();
  console.log("Database cleared.");

  // 2. Start Test Server
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`Test server listening on port ${TEST_PORT}`);

  const baseUrl = `http://127.0.0.1:${TEST_PORT}`;

  try {
    // Test Case 1: Sign up Student 1 (creates College A from domain)
    console.log("\n[Test 1] Signing up student 1 (College A)...");
    const signup1Res = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "John Doe",
        email: "john@mit.edu",
        password: "password123",
        phone: "+1234567890",
        collegeName: "Massachusetts Institute of Technology",
      }),
    });
    const signup1Data = await signup1Res.json();
    if (!signup1Data.token) throw new Error("Student 1 Signup failed: " + JSON.stringify(signup1Data));
    console.log("Student 1 token acquired. College registered: " + signup1Data.user.collegeName);
    const token1 = signup1Data.token;

    // Test Case 2: Sign up Student 2 (same domain -> joins College A)
    console.log("\n[Test 2] Signing up student 2 (joins College A)...");
    const signup2Res = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Jane Smith",
        email: "jane@mit.edu",
        password: "password123",
        phone: "+1987654321",
        collegeName: "MIT (Should merge)",
      }),
    });
    const signup2Data = await signup2Res.json();
    if (!signup2Data.token) throw new Error("Student 2 Signup failed: " + JSON.stringify(signup2Data));
    if (signup2Data.user.collegeId !== signup1Data.user.collegeId) {
      throw new Error("Colleges did not merge for same email domain");
    }
    console.log("Student 2 joined same college: " + signup2Data.user.collegeId);
    const token2 = signup2Data.token;

    // Test Case 3: Sign up Student 3 (different domain -> creates College B)
    console.log("\n[Test 3] Signing up student 3 (College B)...");
    const signup3Res = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Bob Jones",
        email: "bob@harvard.edu",
        password: "password123",
        phone: "+1555555555",
        collegeName: "Harvard University",
      }),
    });
    const signup3Data = await signup3Res.json();
    if (!signup3Data.token) throw new Error("Student 3 Signup failed");
    if (signup3Data.user.collegeId === signup1Data.user.collegeId) {
      throw new Error("Harvard student incorrectly linked to MIT collegeId");
    }
    console.log("Student 3 College registered: " + signup3Data.user.collegeName);
    const token3 = signup3Data.token;

    // Test Case 4: Log in User 1
    console.log("\n[Test 4] Logging in student 1...");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "john@mit.edu",
        password: "password123",
      }),
    });
    const loginData = await loginRes.json();
    if (!loginData.token) throw new Error("Login failed");
    console.log("Login successful.");

    // Test Case 5: Report Found Item (Student 1)
    console.log("\n[Test 5] Reporting a found item (Student 1)...");
    const foundRes = await fetch(`${baseUrl}/found-items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token1}`,
      },
      body: JSON.stringify({
        title: "MIT Class Ring",
        description: "Gold class ring with beaver insignia",
        category: "Other",
        location: "Library",
        dateFound: "2026-08-28T10:00:00.000Z",
        imageUrl: "/uploads/ring.jpg",
        holdingLocation: "security_office",
        privateNotes: "Engraved initials 'J.D.' inside band.",
      }),
    });
    const foundItem = await foundRes.json();
    if (!foundItem._id) throw new Error("Failed to report found item: " + JSON.stringify(foundItem));
    console.log("Found item created: " + foundItem.title + " ID: " + foundItem._id);

    // Test Case 6: Get Found Items as Student 2 (MIT) -> privateNotes should be stripped
    console.log("\n[Test 6] Fetching found items as Student 2 (MIT)...");
    const getFoundRes1 = await fetch(`${baseUrl}/found-items`, {
      headers: { "Authorization": `Bearer ${token2}` },
    });
    const getFoundData1 = await getFoundRes1.json();
    const itemAsStudent2 = getFoundData1.items.find(i => i._id === foundItem._id);
    if (!itemAsStudent2) throw new Error("Student 2 could not see MIT listing");
    if (itemAsStudent2.privateNotes !== undefined) {
      throw new Error("Security vulnerability: privateNotes were visible to another student in general list");
    }
    console.log("Successfully verified privateNotes is stripped from list for non-finders.");

    // Test Case 6b: Get single Found Item detail as Student 2 -> privateNotes should be stripped
    console.log("\n[Test 6b] Fetching item detail as Student 2...");
    const getDetailRes = await fetch(`${baseUrl}/found-items/${foundItem._id}`, {
      headers: { "Authorization": `Bearer ${token2}` },
    });
    const detailData = await getDetailRes.json();
    if (detailData.privateNotes !== undefined) {
      throw new Error("Security vulnerability: privateNotes visible in detail endpoint");
    }
    console.log("Successfully verified privateNotes is stripped in detail view.");

    // Test Case 7: Get Found Items as Student 3 (Harvard) -> Should not see MIT listing (College scoping)
    console.log("\n[Test 7] Fetching found items as Harvard Student 3 (Should be empty)...");
    const getFoundRes2 = await fetch(`${baseUrl}/found-items`, {
      headers: { "Authorization": `Bearer ${token3}` },
    });
    const getFoundData2 = await getFoundRes2.json();
    if (getFoundData2.items.some(i => i.collegeId === signup1Data.user.collegeId)) {
      throw new Error("Harvard student saw MIT items! College isolation failure.");
    }
    console.log("Successfully verified Harvard student cannot see MIT items.");

    // Test Case 8: Submit Claim (Student 2 claims MIT ring)
    console.log("\n[Test 8] Submitting claim as Student 2...");
    const claimRes = await fetch(`${baseUrl}/claims`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token2}`,
      },
      body: JSON.stringify({
        foundItemId: foundItem._id,
        proofDetails: "It's my graduation ring, it has J.D. initials inside.",
      }),
    });
    const claimData = await claimRes.json();
    if (!claimData._id) throw new Error("Claim submission failed: " + JSON.stringify(claimData));
    console.log("Claim submitted. Status: " + claimData.status);

    // Test Case 9: Verify Finder (Student 1) received the claim
    console.log("\n[Test 9] Fetching received claims as Student 1 (Finder)...");
    const receivedRes = await fetch(`${baseUrl}/claims/received`, {
      headers: { "Authorization": `Bearer ${token1}` },
    });
    const receivedClaims = await receivedRes.json();
    const matchesClaim = receivedClaims.find(c => c._id === claimData._id);
    if (!matchesClaim) throw new Error("Finder did not receive the claim");
    console.log("Claim found in finder list. Claimant phone number: " + matchesClaim.claimantId.phone);

    // Test Case 10: Accept Claim (Student 1 accepts Student 2's claim)
    console.log("\n[Test 10] Accepting claim as Student 1...");
    const acceptRes = await fetch(`${baseUrl}/claims/${claimData._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token1}`,
      },
      body: JSON.stringify({ status: "accepted" }),
    });
    const acceptData = await acceptRes.json();
    if (acceptData.claim.status !== "accepted") throw new Error("Accept failed");
    console.log("Claim accepted. Item status is now: returned");

    // Verify Item status updated to returned
    const getReturnedItemRes = await fetch(`${baseUrl}/found-items/${foundItem._id}`, {
      headers: { "Authorization": `Bearer ${token1}` },
    });
    const returnedItem = await getReturnedItemRes.json();
    if (returnedItem.status !== "returned") {
      throw new Error("Found item status did not update to returned");
    }
    console.log("Item status correctly updated to 'returned'.");

    console.log("\nALL BACKEND TESTS PASSED SUCCESSFULLY! ✅");
  } catch (error) {
    console.error("\nTEST FAILED ❌");
    console.error(error);
    process.exit(1);
  } finally {
    // Shutdown
    await mongoose.connection.close();
    server.close();
    console.log("Database connection and server closed.");
  }
}

runTests();
