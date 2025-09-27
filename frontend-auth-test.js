// Meridian Frontend Authentication Test
// Run this script in the browser console on http://localhost:3000/login

console.log("🧭 Starting Meridian Frontend Authentication Tests");
console.log("===============================================");

// Test 1: Check if API client is available
try {
    console.log("\n📝 Testing: API client availability");
    if (typeof fetch !== 'undefined') {
        console.log("✅ PASS - Fetch API available");
    } else {
        console.log("❌ FAIL - Fetch API not available");
    }
} catch (e) {
    console.log("❌ FAIL - Error testing fetch:", e.message);
}

// Test 2: Test demo login via API
async function testDemoLogin() {
    console.log("\n📝 Testing: Demo Student Login via API");

    try {
        const response = await fetch('http://localhost:8000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'student@demo.com',
                password: 'demo123'
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ PASS - Demo login successful");
            console.log("📄 User:", data.user.name, "-", data.user.role);
            console.log("🔑 Token:", data.token);
            return data;
        } else {
            console.log("❌ FAIL - Demo login failed:", response.status);
            const errorData = await response.json();
            console.log("📄 Error:", errorData);
        }
    } catch (error) {
        console.log("❌ FAIL - Network error:", error.message);
    }
}

// Test 3: Test token storage
function testTokenStorage(authData) {
    console.log("\n📝 Testing: Token storage");

    try {
        if (authData && authData.token) {
            localStorage.setItem('meridian_token', authData.token);
            const storedToken = localStorage.getItem('meridian_token');

            if (storedToken === authData.token) {
                console.log("✅ PASS - Token stored successfully");
            } else {
                console.log("❌ FAIL - Token storage mismatch");
            }
        } else {
            console.log("⚠️  SKIP - No auth data provided");
        }
    } catch (error) {
        console.log("❌ FAIL - Token storage error:", error.message);
    }
}

// Test 4: Test protected endpoint
async function testProtectedEndpoint() {
    console.log("\n📝 Testing: Protected endpoint with token");

    try {
        const token = localStorage.getItem('meridian_token');
        if (!token) {
            console.log("⚠️  SKIP - No token found in storage");
            return;
        }

        const response = await fetch('http://localhost:8000/auth/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ PASS - Protected endpoint accessible");
            console.log("📄 Current user:", data.name, "-", data.role);
        } else {
            console.log("❌ FAIL - Protected endpoint failed:", response.status);
            const errorData = await response.json();
            console.log("📄 Error:", errorData);
        }
    } catch (error) {
        console.log("❌ FAIL - Protected endpoint error:", error.message);
    }
}

// Test 5: Test logout
function testLogout() {
    console.log("\n📝 Testing: Logout (token removal)");

    try {
        localStorage.removeItem('meridian_token');
        const token = localStorage.getItem('meridian_token');

        if (!token) {
            console.log("✅ PASS - Token removed successfully");
        } else {
            console.log("❌ FAIL - Token still present after logout");
        }
    } catch (error) {
        console.log("❌ FAIL - Logout error:", error.message);
    }
}

// Run all tests
async function runAllTests() {
    console.log("\n🔬 Running complete frontend authentication test suite...\n");

    // Run demo login test
    const authData = await testDemoLogin();

    // Test token storage
    testTokenStorage(authData);

    // Test protected endpoint
    await testProtectedEndpoint();

    // Test logout
    testLogout();

    console.log("\n✨ Frontend authentication tests completed!");
    console.log("📋 Check the results above for any failures.");
}

// Instructions for manual testing
console.log("\n📋 Manual Test Instructions:");
console.log("1. Run: runAllTests()");
console.log("2. Test demo buttons by clicking them");
console.log("3. Try logging in with: student@demo.com / any password");
console.log("4. Check if you get redirected to dashboard");
console.log("5. Verify dashboard shows correct user info");

// Auto-run tests
runAllTests();
