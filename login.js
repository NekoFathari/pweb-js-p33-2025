document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const message = document.getElementById('message');
  const loading = document.getElementById('loading');

  // Reset tampilan pesan
  message.textContent = '';
  loading.classList.remove('hidden');

  // Validasi input
  if (!username || !password) {
    message.textContent = '⚠️ Username and password cannot be empty.';
    loading.classList.add('hidden');
    return;
  }

  try {
    const response = await fetch('https://dummyjson.com/users');
    if (!response.ok) throw new Error('Gagal memuat data user.');

    const data = await response.json();
    console.log("Data dari API:", data);
    console.log("Daftar username:", data.users.map(u => u.username));

    const users = data.users;
    // Cek apakah username ada di dummyJSON
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
      message.textContent = '❌ Username not found.';
    } else {
      // Password harus sesuai dengan dummy JSON
      if (password === '') {
        message.textContent = '⚠️ The password cannot be empty.';
      } else if (user.password === password) {
        // Simpan data user ke localStorage
        localStorage.setItem('firstName', user.firstName);
        message.textContent = `✅ Login successful! Welcome, ${user.firstName}.`;

        // Redirect ke recipes page setelah 1.5 detik
        setTimeout(() => {
          window.location.href = 'recipes.html';
        }, 1500);
      } else {
        message.textContent = '❌ Password salah.';
      }
    }
  } catch (error) {
    message.textContent = '❌ Terjadi kesalahan saat koneksi API.';
    console.error(error);
  } finally {
    loading.classList.add('hidden');
  }
});
