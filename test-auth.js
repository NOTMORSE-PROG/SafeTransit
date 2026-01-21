// Test script to verify auth endpoint
// Run with: node test-auth.js

const testSignup = async () => {
  const url = 'https://safetransitbackend.vercel.app/api/auth';
  
  const body = {
    email: 'test@example.com',
    password: 'Test123!@#',
    fullName: 'Test User'
  };

  console.log('Testing signup endpoint...');
  console.log('URL:', url);
  console.log('Body:', JSON.stringify(body, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testSignup();
