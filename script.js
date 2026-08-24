const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) 
{
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}
const Store = 
{
  get(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  },
  save(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
  }
};
const SAMPLE_DONORS = 
[
  { name: 'Rahim Uddin', bloodGroup: 'O+', city: 'Chattogram', phone: '01711-000001', available: true, lastDonation: '2026-03-10' },
  { name: 'Karim Hossain', bloodGroup: 'A+', city: 'Dhaka', phone: '01711-000002', available: true, lastDonation: '2026-05-02' },
  { name: 'Fatema Begum', bloodGroup: 'B+', city: 'Chattogram', phone: '01711-000003', available: false, lastDonation: '2026-01-18' },
  { name: 'Nusrat Jahan', bloodGroup: 'AB+', city: 'Sylhet', phone: '01711-000004', available: true, lastDonation: '2025-11-22' },
  { name: 'Imran Kabir', bloodGroup: 'O-', city: 'Dhaka', phone: '01711-000005', available: true, lastDonation: '2026-04-14' },
  { name: 'Sabrina Akter', bloodGroup: 'A-', city: 'Chattogram', phone: '01711-000006', available: false, lastDonation: '2025-09-30' },
  { name: 'Tanvir Ahmed', bloodGroup: 'B-', city: 'Khulna', phone: '01711-000007', available: true, lastDonation: '2026-02-08' },
  { name: 'Mahia Islam', bloodGroup: 'AB-', city: 'Dhaka', phone: '01711-000008', available: true, lastDonation: '2026-06-01' }
];

const SAMPLE_REQUESTS = 
[
  { patient: 'Jasim Uddin', bloodGroup: 'O+', units: 2, hospital: 'City General Hospital', city: 'Chattogram', requiredDate: '2026-08-20', contact: '01911-111111', status: 'Pending', emergency: true },
  { patient: 'Ayesha Siddika', bloodGroup: 'A+', units: 1, hospital: 'Metro Medical College', city: 'Dhaka', requiredDate: '2026-08-25', contact: '01911-222222', status: 'Approved', emergency: false },
  { patient: 'Habibur Rahman', bloodGroup: 'B+', units: 3, hospital: 'Central Hospital', city: 'Sylhet', requiredDate: '2026-08-18', contact: '01911-333333', status: 'Pending', emergency: false }
];

const SAMPLE_USERS = 
[
  { name: 'Rahim Uddin', email: 'rahim@example.com', role: 'Donor', status: 'Approved' },
  { name: 'Karim Hossain', email: 'karim@example.com', role: 'Donor', status: 'Approved' },
  { name: 'Jasim Uddin', email: 'jasim@example.com', role: 'Recipient', status: 'Approved' },
  { name: 'Nusrat Jahan', email: 'nusrat@example.com', role: 'Donor', status: 'Pending' }
];

function setFieldError(inputEl, message) 
{
  const group = inputEl.closest('.form-group');
  if (!group) return;
  const errorEl = group.querySelector('.error-text');
  if (message) {
    group.classList.add('has-error');
    if (errorEl) errorEl.textContent = message;
  } else {
    group.classList.remove('has-error');
  }
}

function showAlert(alertEl, message, type) 
{
  alertEl.textContent = message;
  alertEl.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-error');
  alertEl.style.display = 'block';
  alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    let isValid = true;
    const name = document.getElementById('reg-name');
    const email = document.getElementById('reg-email');
    const phone = document.getElementById('reg-phone');
    const password = document.getElementById('reg-password');
    const confirm = document.getElementById('reg-confirm');
    const role = document.getElementById('reg-role');
    const alertBox = document.getElementById('register-alert');

    if (name.value.trim().length < 3) {
      setFieldError(
        name,
        'Please enter your full name (at least 3 characters).'
      );

      isValid = false;
    } else {
      setFieldError(name, '');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value.trim())) {
      setFieldError(
        email,
        'Please enter a valid email address.'
      );
      isValid = false;
    } else {
      setFieldError(email, '');
    }
    const phonePattern = /^[0-9+\-\s]{7,15}$/;
    if (!phonePattern.test(phone.value.trim())) {
      setFieldError(
        phone,
        'Please enter a valid phone number.'
      );
      isValid = false;
    } else {
      setFieldError(phone, '');
    }

    if (password.value.length < 6) {
      setFieldError(
        password,
        'Password must be at least 6 characters.'
      );
      isValid = false;
    } else {
      setFieldError(password, '');
    }
    if (confirm.value !== password.value) {
      setFieldError(
        confirm,
        'Passwords do not match.'
      );
      isValid = false;
    } else {
      setFieldError(confirm, '');
    }

    if (!isValid) {
      showAlert(
        alertBox,
        'Please fix the highlighted fields and try again.',
        'error'
      );
      return;
    }

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name.value.trim(),
            email: email.value.trim(),
            phone: phone.value.trim(),
            role: role.value,
            password: password.value
          })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        showAlert(
          alertBox,
          data.message || 'Registration failed.',
          'error'
        );
        return;
      }
      localStorage.setItem(
        'token',
        data.token
      );
      localStorage.setItem(
        'currentUser',
        JSON.stringify(data.user)
      );
      showAlert(
        alertBox,
        'Account created successfully!',
        'success'
      );
      registerForm.reset();

    } catch (error) {
      console.error(
        'Registration error:',
        error
      );
      showAlert(
        alertBox,
        'Unable to connect to the backend server.',
        'error'
      );
    }
  });
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('login-email');
    const password = document.getElementById('login-password');
    const alertBox = document.getElementById('login-alert');
    let isValid = true;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value.trim())) {
      setFieldError(
        email,
        'Please enter a valid email address.'
      );
      isValid = false;
    } else {
      setFieldError(email, '');
    }

    if (password.value.length === 0) {
      setFieldError(
        password,
        'Please enter your password.'
      );
      isValid = false;
    } else {
      setFieldError(password, '');
    }

    if (!isValid) {
      showAlert(
        alertBox,
        'Please fix the highlighted fields and try again.',
        'error'
      );
      return;
    }

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email.value.trim(),
            password: password.value
          })
        }
      );
      const data = await response.json()
      if (!response.ok) {
        showAlert(
          alertBox,
          data.message || 'Login failed.',
          'error'
        );
        return;
      }
      localStorage.setItem(
        'token',
        data.token
      );
      localStorage.setItem(
        'currentUser',
        JSON.stringify(data.user)
      );
      showAlert(
        alertBox,
        'Login successful! Redirecting...',
        'success'
      );

      setTimeout(() => {
        if (data.user.role === 'Donor') {
          window.location.href = 'donor.html';
        } else if (data.user.role === 'Admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'index.html';
        }
      }, 900);
    } catch (error) {
      console.error(
        'Login error:',
        error
      );
      showAlert(
        alertBox,
        'Unable to connect to the backend server.',
        'error'
      );
    }
  });
}

const donorForm = document.getElementById('donor-form');
if (donorForm) {
  const savedProfile = Store.get('myDonorProfile', null);
  if (savedProfile) {
    document.getElementById('donor-bloodgroup').value = savedProfile.bloodGroup || '';
    document.getElementById('donor-gender').value = savedProfile.gender || '';
    document.getElementById('donor-age').value = savedProfile.age || '';
    document.getElementById('donor-city').value = savedProfile.city || '';
    document.getElementById('donor-address').value = savedProfile.address || '';
    document.getElementById('donor-available').checked = !!savedProfile.available;
  }

  donorForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const age = document.getElementById('donor-age');
    const alertBox = document.getElementById('donor-alert');
    let isValid = true;

    if (age.value < 18 || age.value > 65) {
      setFieldError(age, 'Donors must be between 18 and 65 years old.');
      isValid = false;
    } else {
      setFieldError(age, '');
    }

    if (!isValid) {
      showAlert(alertBox, 'Please fix the highlighted fields and try again.', 'error');
      return;
    }

    const profile = {
      bloodGroup: document.getElementById('donor-bloodgroup').value,
      gender: document.getElementById('donor-gender').value,
      age: age.value,
      city: document.getElementById('donor-city').value.trim(),
      address: document.getElementById('donor-address').value.trim(),
      available: document.getElementById('donor-available').checked
    };
    Store.save('myDonorProfile', profile);
    showAlert(alertBox, 'Donor profile saved successfully.', 'success');
  });

  const historyBody = document.getElementById('donation-history-body');
  if (historyBody) {
    const history = Store.get('myDonationHistory', [
      { date: '2025-11-02', location: 'City General Hospital', quantity: '1 unit' },
      { date: '2025-05-19', location: 'Red Crescent Blood Camp', quantity: '1 unit' }
    ]);
    historyBody.innerHTML = history.map(row => `
      <tr>
        <td>${row.date}</td>
        <td>${row.location}</td>
        <td>${row.quantity}</td>
      </tr>
    `).join('');
  }
}

const searchForm = document.getElementById('search-form');
if (searchForm) {
  const resultsBody = document.getElementById('search-results-body');
  const resultsCount = document.getElementById('search-results-count');

  function renderDonors(list) {
    resultsBody.innerHTML = list.map(d => `
      <tr>
        <td>${d.name}</td>
        <td>${d.bloodGroup}</td>
        <td>${d.city}</td>
        <td>${d.phone}</td>
        <td><span class="pill ${d.available ? 'pill-success' : 'pill-neutral'}">${d.available ? 'Available' : 'Not available'}</span></td>
      </tr>
    `).join('');
    resultsCount.textContent = `${list.length} donor${list.length === 1 ? '' : 's'} found`;
  }

  function applyFilters() {
    const donors = Store.get('donors', SAMPLE_DONORS);
    const bloodGroup = document.getElementById('search-bloodgroup').value;
    const city = document.getElementById('search-city').value.trim().toLowerCase();
    const onlyAvailable = document.getElementById('search-available').checked;

    const filtered = donors.filter(d => {
      const matchesGroup = !bloodGroup || d.bloodGroup === bloodGroup;
      const matchesCity = !city || d.city.toLowerCase().includes(city);
      const matchesAvailability = !onlyAvailable || d.available;
      return matchesGroup && matchesCity && matchesAvailability;
    });

    renderDonors(filtered);
  }

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    applyFilters();
  });

  document.getElementById('search-reset').addEventListener('click', () => {
    searchForm.reset();
    renderDonors(Store.get('donors', SAMPLE_DONORS));
  });

  renderDonors(Store.get('donors', SAMPLE_DONORS));
}

const requestForm = document.getElementById('request-form');
if (requestForm) {
  const alertBox = document.getElementById('request-alert');
  const listBody = document.getElementById('my-requests-body');

  function renderMyRequests() {
    const requests = Store.get('requests', SAMPLE_REQUESTS);
    listBody.innerHTML = requests.map(r => `
      <tr>
        <td>${r.patient}</td>
        <td>${r.bloodGroup}</td>
        <td>${r.units}</td>
        <td>${r.hospital}</td>
        <td>${r.requiredDate}</td>
        <td><span class="pill ${r.status === 'Approved' ? 'pill-success' : 'pill-warning'}">${r.status}</span></td>
      </tr>
    `).join('');
  }

  requestForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const units = document.getElementById('req-units');
    let isValid = true;

    if (units.value < 1) {
      setFieldError(units, 'Units required must be at least 1.');
      isValid = false;
    } else {
      setFieldError(units, '');
    }

    if (!isValid) {
      showAlert(alertBox, 'Please fix the highlighted fields and try again.', 'error');
      return;
    }

    const requests = Store.get('requests', SAMPLE_REQUESTS);
    requests.unshift({
      patient: document.getElementById('req-patient').value.trim(),
      bloodGroup: document.getElementById('req-bloodgroup').value,
      units: units.value,
      hospital: document.getElementById('req-hospital').value.trim(),
      city: document.getElementById('req-city').value.trim(),
      requiredDate: document.getElementById('req-date').value,
      contact: document.getElementById('req-contact').value.trim(),
      status: 'Pending',
      emergency: document.getElementById('req-emergency').checked
    });
    Store.save('requests', requests);

    showAlert(alertBox, 'Blood request submitted. We will notify matching donors nearby.', 'success');
    requestForm.reset();
    renderMyRequests();
  });

  renderMyRequests();
}

const adminTabs = document.querySelectorAll('.tab-btn');
if (adminTabs.length > 0) {
  adminTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      adminTabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  const donors = Store.get('donors', SAMPLE_DONORS);
  const requests = Store.get('requests', SAMPLE_REQUESTS);
  const users = Store.get('users', SAMPLE_USERS);

  const elTotalUsers = document.getElementById('stat-total-users');
  const elTotalDonors = document.getElementById('stat-total-donors');
  const elPendingRequests = document.getElementById('stat-pending-requests');
  const elEmergency = document.getElementById('stat-emergency');

  if (elTotalUsers) elTotalUsers.textContent = users.length;
  if (elTotalDonors) elTotalDonors.textContent = donors.length;
  if (elPendingRequests) elPendingRequests.textContent = requests.filter(r => r.status === 'Pending').length;
  if (elEmergency) elEmergency.textContent = requests.filter(r => r.emergency).length;

  const usersBody = document.getElementById('admin-users-body');
  if (usersBody) {
    function renderUsers() {
      const list = Store.get('users', SAMPLE_USERS);
      usersBody.innerHTML = list.map((u, index) => `
        <tr>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td>${u.role}</td>
          <td><span class="pill ${u.status === 'Approved' ? 'pill-success' : 'pill-warning'}">${u.status}</span></td>
          <td>
            ${u.status === 'Pending'
              ? `<button class="btn btn-primary btn-sm" data-approve-user="${index}">Approve</button>`
              : '—'}
          </td>
        </tr>
      `).join('');
    }
    renderUsers();

    usersBody.addEventListener('click', (event) => {
      const index = event.target.dataset.approveUser;
      if (index === undefined) return;
      const list = Store.get('users', SAMPLE_USERS);
      list[index].status = 'Approved';
      Store.save('users', list);
      renderUsers();
    });
  }

  const requestsBody = document.getElementById('admin-requests-body');
  if (requestsBody) {
    function renderRequests() {
      const list = Store.get('requests', SAMPLE_REQUESTS);
      requestsBody.innerHTML = list.map((r, index) => `
        <tr>
          <td>${r.patient}</td>
          <td>${r.bloodGroup}</td>
          <td>${r.units}</td>
          <td>${r.hospital}, ${r.city}</td>
          <td>${r.requiredDate}</td>
          <td><span class="pill ${r.status === 'Approved' ? 'pill-success' : 'pill-warning'}">${r.status}</span></td>
          <td>
            ${r.status === 'Pending'
              ? `<button class="btn btn-primary btn-sm" data-approve-request="${index}">Approve</button>`
              : '—'}
          </td>
        </tr>
      `).join('');
    }
    renderRequests();

    requestsBody.addEventListener('click', (event) => {
      const index = event.target.dataset.approveRequest;
      if (index === undefined) return;
      const list = Store.get('requests', SAMPLE_REQUESTS);
      list[index].status = 'Approved';
      Store.save('requests', list);
      renderRequests();
    });
  }
}
