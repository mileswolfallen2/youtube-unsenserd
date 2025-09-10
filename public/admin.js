// Admin Panel JS

document.getElementById('deleteUserForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('deleteUsername').value.trim();
  if (!username) return;
  const res = await fetch('/api/admin/delete-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  const data = await res.json();
  document.getElementById('userDeleteMsg').textContent = data.success ? 'User deleted.' : (data.error || 'Error.');
});

document.getElementById('deleteVideoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('deleteVideoId').value.trim();
  if (!id) return;
  const res = await fetch('/api/admin/delete-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  const data = await res.json();
  document.getElementById('videoDeleteMsg').textContent = data.success ? 'Video deleted.' : (data.error || 'Error.');
});
