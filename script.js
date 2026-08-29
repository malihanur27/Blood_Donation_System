const API_URL = window.LIFEDROP_API_URL ||
  ((window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : `${window.location.origin}/api`);

const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const requestUrl =
    typeof input === 'string'
      ? input
      : (input && input.url) || '';

  if (requestUrl.startsWith(API_URL)) {
    return nativeFetch(input, {
      ...init,
      credentials: init.credentials || 'include'
    });
  }

  return nativeFetch(input, init);
};

localStorage.removeItem('token');

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

function setFieldError(inputEl, message) {
  if (!inputEl) return;

  const group = inputEl.closest('.form-group');
  if (!group) return;

  const errorEl = group.querySelector('.error-text');

  if (message) {
    group.classList.add('has-error');

    if (errorEl) {
      errorEl.textContent = message;
    }
  } else {
    group.classList.remove('has-error');

    if (errorEl) {
      errorEl.textContent = '';
    }
  }
}

function showAlert(alertEl, message, type = 'error') {
  if (!alertEl) return;

  alertEl.textContent = message;

  alertEl.className =
    'alert ' +
    (type === 'success'
      ? 'alert-success'
      : 'alert-error');

  alertEl.style.display = 'block';
}

function getStoredUser() {
  try {
    const user = localStorage.getItem('user');

    return user
      ? JSON.parse(user)
      : null;
  } catch (error) {
    return null;
  }
}

function getToken() {
  return getStoredUser() ? 'cookie-session' : null;
}

function authHeaders() {
  return {
    'Content-Type': 'application/json'
  };
}

async function logoutUser() {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Logout request failed:', error);
  } finally {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function statusClass(status) {
  if (
    status === 'Approved' ||
    status === 'Fulfilled' ||
    status === 'Donated' ||
    status === 'Available'
  ) {
    return 'pill-success';
  }

  if (
    status === 'Pending' ||
    status === 'Matched' ||
    status === 'Critical'
  ) {
    return 'pill-warning';
  }

  return 'pill-neutral';
}

    if (window.location.pathname.includes("admin.html")) {

    const user = getStoredUser();

    if (!user || user.role !== "Admin") {

        alert("Admin access required");

        window.location.href = "login.html";

    }
}

function updateNavbarAuth() {

  const navActions =
    document.querySelector('.nav-actions');

  const mainNavLinks =
    document.querySelector('.nav-links');

  const mobileNavToggle =
    document.querySelector('.nav-toggle');

  const adminNavLink =
    document.querySelector(
      '.nav-links a[href="admin.html"]'
    );

  if (!navActions) {
    return;
  }

  const token = getToken();
  const user = getStoredUser();

  
  if (!token || !user) {

    if (mainNavLinks) {
      mainNavLinks.style.display = '';
    }

    if (mobileNavToggle) {
      mobileNavToggle.style.display = '';
    }

    navActions.innerHTML = `
      <a
        href="login.html"
        class="btn btn-outline btn-sm"
      >
        Log In
      </a>

      <a
        href="register.html"
        class="btn btn-primary btn-sm"
      >
        Sign Up
      </a>
    `;

    return;
  }

  const isAccountPage =
    window.location.pathname.includes(
      'account.html'
    );

  
  if (
    user.role === 'Admin' &&
    isAccountPage
  ) {

    // Hide normal user navigation
    if (mainNavLinks) {
      mainNavLinks.style.display = 'none';
      mainNavLinks.classList.remove('open');
    }

    if (mobileNavToggle) {
      mobileNavToggle.style.display = 'none';
    }

    // Admin only sees dashboard + logout
    navActions.innerHTML = `
      <a
        href="admin.html"
        class="btn btn-outline btn-sm"
      >
        Admin Dashboard
      </a>

      <button
        type="button"
        id="navbar-logout"
        class="btn btn-primary btn-sm"
      >
        Log Out
      </button>
    `;

    const logoutButton =
      document.getElementById(
        'navbar-logout'
      );

    if (logoutButton) {
      logoutButton.addEventListener(
        'click',
        logoutUser
      );
    }

    return;
  }

  
  if (mainNavLinks) {
    mainNavLinks.style.display = '';
  }

  if (mobileNavToggle) {
    mobileNavToggle.style.display = '';
  }

  // Only Admin sees Admin link
  if (adminNavLink) {

    const adminNavItem =
      adminNavLink.closest('li') ||
      adminNavLink;

    adminNavItem.style.display =
      user.role === 'Admin'
        ? ''
        : 'none';
  }

  let profilePage = 'request.html';

  if (user.role === 'Donor') {
    profilePage = 'donor.html';
  }

  if (user.role === 'Admin') {
    profilePage = 'admin.html';
  }

  const displayName =
    escapeHtml(user.name) ||
    'Profile';

  navActions.innerHTML = `
    <a
      href="${profilePage}"
      class="btn btn-outline btn-sm"
    >
      👤 ${displayName}
    </a>

    <a
      href="account.html"
      class="btn btn-outline btn-sm"
    >
      ⚙ Account
    </a>

    <button
      type="button"
      id="navbar-logout"
      class="btn btn-primary btn-sm"
    >
      Log Out
    </button>
  `;

  const logoutButton =
    document.getElementById(
      'navbar-logout'
    );

  if (logoutButton) {
    logoutButton.addEventListener(
      'click',
      logoutUser
    );
  }
}

updateNavbarAuth();
function updateNavbarAuth() {

  const navActions =
    document.querySelector('.nav-actions');

  const mainNavLinks =
    document.querySelector('.nav-links');

  const mobileNavToggle =
    document.querySelector('.nav-toggle');

  const adminNavLink =
    document.querySelector(
      '.nav-links a[href="admin.html"]'
    );

  if (!navActions) {
    return;
  }

  const token = getToken();
  const user = getStoredUser();


  if (!token || !user) {

    if (mainNavLinks) {
      mainNavLinks.style.display = '';
    }

    if (mobileNavToggle) {
      mobileNavToggle.style.display = '';
    }

    navActions.innerHTML = `
      <a
        href="login.html"
        class="btn btn-outline btn-sm"
      >
        Log In
      </a>

      <a
        href="register.html"
        class="btn btn-primary btn-sm"
      >
        Sign Up
      </a>
    `;

    return;
  }

  const isAccountPage =
    window.location.pathname.includes(
      'account.html'
    );


  if (
    user.role === 'Admin' &&
    isAccountPage
  ) {


    if (mainNavLinks) {
      mainNavLinks.style.display = 'none';
      mainNavLinks.classList.remove('open');
    }

    if (mobileNavToggle) {
      mobileNavToggle.style.display = 'none';
    }

    navActions.innerHTML = `
      <a
        href="admin.html"
        class="btn btn-outline btn-sm"
      >
        Admin Dashboard
      </a>

      <button
        type="button"
        id="navbar-logout"
        class="btn btn-primary btn-sm"
      >
        Log Out
      </button>
    `;

    const logoutButton =
      document.getElementById(
        'navbar-logout'
      );

    if (logoutButton) {
      logoutButton.addEventListener(
        'click',
        logoutUser
      );
    }

    return;
  }


  if (mainNavLinks) {
    mainNavLinks.style.display = '';
  }

  if (mobileNavToggle) {
    mobileNavToggle.style.display = '';
  }

  if (adminNavLink) {

    const adminNavItem =
      adminNavLink.closest('li') ||
      adminNavLink;

    adminNavItem.style.display =
      user.role === 'Admin'
        ? ''
        : 'none';
  }

  let profilePage = 'request.html';

  if (user.role === 'Donor') {
    profilePage = 'donor.html';
  }

  if (user.role === 'Admin') {
    profilePage = 'admin.html';
  }

  const displayName =
    escapeHtml(user.name) ||
    'Profile';

  navActions.innerHTML = `
    <a
      href="${profilePage}"
      class="btn btn-outline btn-sm"
    >
      👤 ${displayName}
    </a>

    <a
      href="account.html"
      class="btn btn-outline btn-sm"
    >
      ⚙ Account
    </a>

    <button
      type="button"
      id="navbar-logout"
      class="btn btn-primary btn-sm"
    >
      Log Out
    </button>
  `;

  const logoutButton =
    document.getElementById(
      'navbar-logout'
    );

  if (logoutButton) {
    logoutButton.addEventListener(
      'click',
      logoutUser
    );
  }
}

updateNavbarAuth();
function updateNavbarAuth() {

  const navActions =
    document.querySelector('.nav-actions');

  const mainNavLinks =
    document.querySelector('.nav-links');

  const mobileNavToggle =
    document.querySelector('.nav-toggle');

  const adminNavLink =
    document.querySelector(
      '.nav-links a[href="admin.html"]'
    );

  if (!navActions) {
    return;
  }

  const token = getToken();
  const user = getStoredUser();

  if (!token || !user) {

    if (mainNavLinks) {
      mainNavLinks.style.display = '';
    }

    if (mobileNavToggle) {
      mobileNavToggle.style.display = '';
    }

    navActions.innerHTML = `
      <a
        href="login.html"
        class="btn btn-outline btn-sm"
      >
        Log In
      </a>

      <a
        href="register.html"
        class="btn btn-primary btn-sm"
      >
        Sign Up
      </a>
    `;

    return;
  }

  const isAccountPage =
    window.location.pathname.includes(
      'account.html'
    );

  if (
    user.role === 'Admin' &&
    isAccountPage
  ) {

    if (mainNavLinks) {
      mainNavLinks.style.display = 'none';
      mainNavLinks.classList.remove('open');
    }

    if (mobileNavToggle) {
      mobileNavToggle.style.display = 'none';
    }

    navActions.innerHTML = `
      <a
        href="admin.html"
        class="btn btn-outline btn-sm"
      >
        Admin Dashboard
      </a>

      <button
        type="button"
        id="navbar-logout"
        class="btn btn-primary btn-sm"
      >
        Log Out
      </button>
    `;

    const logoutButton =
      document.getElementById(
        'navbar-logout'
      );

    if (logoutButton) {
      logoutButton.addEventListener(
        'click',
        logoutUser
      );
    }

    return;
  }



  if (mainNavLinks) {
    mainNavLinks.style.display = '';
  }

  if (mobileNavToggle) {
    mobileNavToggle.style.display = '';
  }

  if (adminNavLink) {

    const adminNavItem =
      adminNavLink.closest('li') ||
      adminNavLink;

    adminNavItem.style.display =
      user.role === 'Admin'
        ? ''
        : 'none';
  }

  let profilePage = 'request.html';

  if (user.role === 'Donor') {
    profilePage = 'donor.html';
  }

  if (user.role === 'Admin') {
    profilePage = 'admin.html';
  }

  const displayName =
    escapeHtml(user.name) ||
    'Profile';

  navActions.innerHTML = `
    <a
      href="${profilePage}"
      class="btn btn-outline btn-sm"
    >
      👤 ${displayName}
    </a>

    <a
      href="account.html"
      class="btn btn-outline btn-sm"
    >
      ⚙ Account
    </a>

    <button
      type="button"
      id="navbar-logout"
      class="btn btn-primary btn-sm"
    >
      Log Out
    </button>
  `;

  const logoutButton =
    document.getElementById(
      'navbar-logout'
    );

  if (logoutButton) {
    logoutButton.addEventListener(
      'click',
      logoutUser
    );
  }
}

updateNavbarAuth();

if (window.location.pathname.includes("admin.html")) {

    const user = getStoredUser();

    if (!user || user.role !== "Admin") {

        alert("Admin access required");

        window.location.href = "login.html";

    }
}

const registerForm =
  document.getElementById(
    'register-form'
  );

if (registerForm) {
  registerForm.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      const name =
        document.getElementById(
          'reg-name'
        );

      const email =
        document.getElementById(
          'reg-email'
        );

      const phone =
        document.getElementById(
          'reg-phone'
        );

      const role =
        document.getElementById(
          'reg-role'
        );

      const password =
        document.getElementById(
          'reg-password'
        );

      const confirm =
        document.getElementById(
          'reg-confirm'
        );

      const alertBox =
        document.getElementById(
          'register-alert'
        );

      let isValid = true;

      if (
    !name ||
    !email ||
    !phone ||
    !password ||
    !confirm
) {
        showAlert(
          alertBox,
          'Registration form fields are missing.',
          'error'
        );

        return;
      }

      if (
        name.value.trim().length < 3
      ) {
        setFieldError(
          name,
          'Please enter your full name.'
        );

        isValid = false;
      } else {
        setFieldError(name, '');
      }

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          email.value.trim()
        )
      ) {
        setFieldError(
          email,
          'Please enter a valid email.'
        );

        isValid = false;
      } else {
        setFieldError(email, '');
      }

      const phonePattern =
        /^[0-9+\-\s]{7,15}$/;

      if (
        !phonePattern.test(
          phone.value.trim()
        )
      ) {
        setFieldError(
          phone,
          'Please enter a valid phone number.'
        );

        isValid = false;
      } else {
        setFieldError(phone, '');
      }

      if (
        password.value.length < 6
      ) {
        setFieldError(
          password,
          'Password must be at least 6 characters.'
        );

        isValid = false;
      } else {
        setFieldError(password, '');
      }

      if (
        confirm.value !==
        password.value
      ) {
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
          'Please fix the form errors.',
          'error'
        );

        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/auth/register`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },
body: JSON.stringify({

    name:
        name.value.trim(),

    email:
        email.value.trim(),

    phone:
        phone.value.trim(),

    role:
        role ? role.value : 'Donor',

    password:
        password.value

})
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            'Registration failed.'
          );
        }

        showAlert(
          alertBox,
          'Registration successful! Please wait for admin approval before logging in.',
          'success'
        );

        registerForm.reset();

        setTimeout(() => {
          window.location.href =
            'login.html';
        }, 1000);

      } catch (error) {
        console.error(
          'Registration error:',
          error
        );

        showAlert(
          alertBox,
          error.message ||
          'Registration failed.',
          'error'
        );
      }
    }
  );
}
const loginForm =
  document.getElementById(
    'login-form'
  );

if (loginForm) {
  loginForm.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      const email =
        document.getElementById(
          'login-email'
        );

      const password =
        document.getElementById(
          'login-password'
        );

      const alertBox =
        document.getElementById(
          'login-alert'
        );

      if (
        !email ||
        !password
      ) {
        showAlert(
          alertBox,
          'Login form fields are missing.',
          'error'
        );

        return;
      }

      if (
        !email.value.trim() ||
        !password.value
      ) {
        showAlert(
          alertBox,
          'Please enter your email and password.',
          'error'
        );

        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/auth/login`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              email:
                email.value.trim(),

              password:
                password.value
            })
          }
        );

        const data =
          await response.json();

        console.log(
          'Login response:',
          data
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
            'Login failed.'
          );
        }

        if (data.user) {
          localStorage.setItem(
            'user',
            JSON.stringify(
              data.user
            )
          );
        }

        showAlert(
          alertBox,
          'Login successful!',
          'success'
        );

        setTimeout(() => {
          const user =
            data.user || {};

          if (
            user.role === 'Admin'
          ) {
            window.location.href =
              'admin.html';

          } else if (
            user.role === 'Donor'
          ) {
            window.location.href =
              'donor.html';

          } else {
            window.location.href =
              'request.html';
          }
        }, 500);

      } catch (error) {
        console.error(
          'Login error:',
          error
        );

        showAlert(
          alertBox,
          error.message ||
          'Unable to login.',
          'error'
        );
      }
    }
  );
}

const donorForm =
  document.getElementById(
    'donor-form'
  );

if (donorForm) {
  const alertBox =
    document.getElementById(
      'donor-alert'
    );

  const bloodGroupEl =
    document.getElementById(
      'donor-bloodgroup'
    );

  const genderEl =
    document.getElementById(
      'donor-gender'
    );

  const ageEl =
    document.getElementById(
      'donor-age'
    );

  const cityEl =
    document.getElementById(
      'donor-city'
    );

  const addressEl =
    document.getElementById(
      'donor-address'
    );

  const availableEl =
    document.getElementById(
      'donor-available'
    );

  const lastDonationEl =
    document.getElementById(
      'donor-last-donation'
    );

  const availabilityStatusEl =
    document.getElementById(
      'donor-availability-status'
    );

  let donorProfileExists = false;

  function ageToDateOfBirth(age) {
    const currentYear =
      new Date().getFullYear();

    const year =
      currentYear -
      Number(age);

    return `${year}-01-01`;
  }

  function dateOfBirthToAge(value) {
    if (!value) {
      return '';
    }

    const birthday =
      new Date(value);

    const today =
      new Date();

    let age =
      today.getFullYear() -
      birthday.getFullYear();

    const monthDifference =
      today.getMonth() -
      birthday.getMonth();

    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        today.getDate() <
        birthday.getDate()
      )
    ) {
      age--;
    }

    return age;
  }

  function donationIntervalStatus(value) {
    const minimumDays = 90;

    if (!value) {
      return {
        eligible: true,
        daysSince: null
      };
    }

    const donationDate =
      new Date(`${value}T00:00:00Z`);

    if (Number.isNaN(donationDate.getTime())) {
      return {
        eligible: false,
        daysSince: null
      };
    }

    const today = new Date();
    const todayAtMidnight = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const dayMs =
      24 * 60 * 60 * 1000;

    const daysSince =
      Math.floor(
        (todayAtMidnight -
          donationDate.getTime()) /
        dayMs
      );

    return {
      eligible:
        daysSince >= minimumDays,
      daysSince
    };
  }

  function renderDonorAvailabilityStatus(donor, status) {
    if (!availabilityStatusEl) return;

    if (!donor) {
      availabilityStatusEl.textContent =
        'Save your donor profile to check your current donation eligibility.';
      return;
    }

    const availability = status || {};
    const requested = availability.requestedAvailability !== undefined
      ? availability.requestedAvailability
      : donor.availabilityRequested !== false;
    const eligible = availability.eligibleByInterval !== undefined
      ? availability.eligibleByInterval
      : donationIntervalStatus(
          donor.lastDonationDate
            ? new Date(donor.lastDonationDate).toISOString().slice(0, 10)
            : ''
        ).eligible;
    const activelyMatched = Boolean(availability.activelyMatched);
    const effectiveAvailable = availability.available !== undefined
      ? availability.available
      : Boolean(donor.available);
    const daysRemaining = Number(availability.daysRemaining || 0);

    if (activelyMatched) {
      availabilityStatusEl.textContent =
        'Unavailable to donate right now because you are matched to an active blood request.';
      return;
    }

    if (!requested) {
      availabilityStatusEl.textContent =
        'Unavailable by your choice. Check "I am currently available to donate" and save when you want to be listed as available.';
      return;
    }

    if (!eligible) {
      availabilityStatusEl.textContent =
        `Not eligible to donate yet. ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining in the 90-day waiting period. Your profile is saved and will become Available automatically when the waiting period is complete.`;
      return;
    }

    if (effectiveAvailable) {
      availabilityStatusEl.textContent =
        'Available to donate. The 90-day waiting-period requirement is complete.';
      return;
    }

    availabilityStatusEl.textContent =
      'Currently unavailable to donate.';
  }

  async function loadDonorProfile() {
    const token = getToken();

    if (!token) {
      showAlert(
        alertBox,
        'Please login first.',
        'error'
      );

      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/donors/me`,
        {
          headers:
            authHeaders()
        }
      );

      if (
        response.status === 404
      ) {
        donorProfileExists = false;

        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          'Unable to load donor profile.'
        );
      }

      donorProfileExists = true;

      const donor =
        data.donor;

      if (bloodGroupEl) {
        bloodGroupEl.value =
          donor.bloodGroup || '';
      }

      if (genderEl) {
        genderEl.value =
          donor.gender || '';
      }

      if (ageEl) {
        ageEl.value =
          dateOfBirthToAge(
            donor.dateOfBirth
          );
      }

      if (cityEl) {
        cityEl.value =
          donor.city || '';
      }

      if (addressEl) {
        addressEl.value =
          donor.address || '';
      }

      if (availableEl) {
        availableEl.checked =
          donor.availabilityRequested !== undefined &&
          donor.availabilityRequested !== null
            ? donor.availabilityRequested !== false
            : donor.available !== false;
      }

      if (lastDonationEl) {
        lastDonationEl.value = donor.lastDonationDate
          ? new Date(donor.lastDonationDate).toISOString().slice(0, 10)
          : '';
      }

      renderDonorAvailabilityStatus(
        donor,
        data.availabilityStatus
      );

    } catch (error) {
      console.error(
        'Load donor error:',
        error
      );

      showAlert(
        alertBox,
        error.message ||
        'Unable to load donor profile.',
        'error'
      );
    }
  }

  donorForm.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      const token =
        getToken();

      if (!token) {
        showAlert(
          alertBox,
          'Please login before creating a donor profile.',
          'error'
        );

        return;
      }

      if (
        !bloodGroupEl ||
        !genderEl ||
        !ageEl ||
        !cityEl ||
        !addressEl ||
        !availableEl ||
        !lastDonationEl
      ) {
        showAlert(
          alertBox,
          'Donor form fields are missing.',
          'error'
        );

        return;
      }

      const age =
        Number(ageEl.value);

      if (
        !Number.isInteger(age) ||
        age < 18 ||
        age > 65
      ) {
        showAlert(
          alertBox,
          'Donor age must be between 18 and 65.',
          'error'
        );

        return;
      }

      if (
        !cityEl.value.trim() ||
        !addressEl.value.trim()
      ) {
        showAlert(
          alertBox,
          'Please enter city and address.',
          'error'
        );

        return;
      }

      const eligibility =
        donationIntervalStatus(
          lastDonationEl.value
        );

      const donorData = {
        bloodGroup:
          bloodGroupEl.value,

        gender:
          genderEl.value,

        dateOfBirth:
          ageToDateOfBirth(age),

        city:
          cityEl.value.trim(),

        address:
          addressEl.value.trim(),

        lastDonationDate:
          lastDonationEl.value || null,


        availabilityRequested:
          availableEl.checked,

        available:
          availableEl.checked &&
          eligibility.eligible
      };

      try {
        const response =
          await fetch(
            donorProfileExists
              ? `${API_URL}/donors/me`
              : `${API_URL}/donors`,
            {
              method:
                donorProfileExists
                  ? 'PUT'
                  : 'POST',

              headers:
                authHeaders(),

              body:
                JSON.stringify(
                  donorData
                )
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            'Unable to save donor.'
          );
        }

        donorProfileExists = true;

        showAlert(
          alertBox,
          data.message ||
          'Donor profile saved successfully!',
          'success'
        );

        renderDonorAvailabilityStatus(
          data.donor,
          data.availabilityStatus
        );

        loadDonationHistory();

        setTimeout(() => {
          if (alertBox) {
            alertBox.style.display = 'none';
          }
        }, 3000);

      } catch (error) {
        console.error(
          'Donor save error:',
          error
        );

        showAlert(
          alertBox,
          error.message ||
          'Unable to save donor.',
          'error'
        );
      }
    }
  );

  loadDonorProfile();
}

const donationHistoryBody = document.getElementById('donation-history-body');

async function loadDonationHistory() {
  if (!donationHistoryBody) return;

  try {
    const response = await fetch(`${API_URL}/donors/me/history`, {
      headers: authHeaders()
    });

    if (response.status === 404) {
      donationHistoryBody.innerHTML = '<tr><td colspan="3">No donation history yet.</td></tr>';
      return;
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Unable to load donation history.');
    }

    const donations = data.donations || [];
    if (!donations.length) {
      donationHistoryBody.innerHTML = '<tr><td colspan="3">No completed donations yet.</td></tr>';
      return;
    }

    donationHistoryBody.innerHTML = donations.map((donation) => {
      const request = donation.bloodRequest || {};
      return `
        <tr>
          <td>${formatDate(donation.donatedAt || donation.updatedAt)}</td>
          <td>${escapeHtml(request.hospitalName) || '—'}${request.city ? `<br><small>${escapeHtml(request.city)}</small>` : ''}</td>
          <td>${escapeHtml(donation.units || 1)} unit</td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Donation history error:', error);
    donationHistoryBody.innerHTML = `<tr><td colspan="3">${escapeHtml(error.message || 'Unable to load donation history.')}</td></tr>`;
  }
}

if (donationHistoryBody) {
  loadDonationHistory();
}

const searchForm =
  document.getElementById(
    'search-form'
  );

if (searchForm) {
  const resultsBody =
    document.getElementById(
      'search-results-body'
    );

  const resultsCount =
    document.getElementById(
      'search-results-count'
    );

  const resetButton =
    document.getElementById(
      'search-reset'
    );

  function renderDonors(donors) {
    if (!resultsBody) {
      return;
    }

    if (
      !Array.isArray(donors) ||
      donors.length === 0
    ) {
      resultsBody.innerHTML = `
        <tr>
          <td colspan="5">
            No donors found.
          </td>
        </tr>
      `;

      if (resultsCount) {
        resultsCount.textContent =
          '0 donors found';
      }

      return;
    }

    resultsBody.innerHTML =
      donors
        .map((donor) => {
          const user =
            donor.user || {};

          return `
            <tr>
              <td>
                ${escapeHtml(user.name) || '—'}
              </td>

              <td>
                ${escapeHtml(donor.bloodGroup) || '—'}
              </td>

              <td>
                ${escapeHtml(donor.city) || '—'}
              </td>

              <td>
                ${user.phone ? escapeHtml(user.phone) : '<a href="login.html">Log in to view</a>'}
              </td>

              <td>
                <span class="pill ${
                  donor.available
                    ? 'pill-success'
                    : 'pill-neutral'
                }">
                  ${
                    donor.available
                      ? 'Available'
                      : 'Not Available'
                  }
                </span>
              </td>
            </tr>
          `;
        })
        .join('');

    if (resultsCount) {
      resultsCount.textContent =
        `${donors.length} donor(s) found`;
    }
  }

  async function loadDonors() {
    const bloodGroup =
      document.getElementById(
        'search-bloodgroup'
      );

    const city =
      document.getElementById(
        'search-city'
      );

    const available =
      document.getElementById(
        'search-available'
      );

    const params =
      new URLSearchParams();

    if (
      bloodGroup &&
      bloodGroup.value
    ) {
      params.set(
        'bloodGroup',
        bloodGroup.value
      );
    }

    if (
      city &&
      city.value.trim()
    ) {
      params.set(
        'city',
        city.value.trim()
      );
    }

    try {
      const query =
        params.toString();

      const url =
        query
          ? `${API_URL}/donors?${query}`
          : `${API_URL}/donors`;

      const response =
        await fetch(url);

      const data =
        await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('user');
          throw new Error(
            'Please log in with an approved account to search donors.'
          );
        }

        throw new Error(
          data.message ||
          'Unable to search donors.'
        );
      }

      let donors =
        data.donors || [];

      if (
        available &&
        available.checked
      ) {
        donors =
          donors.filter(
            (donor) =>
              donor.available
          );
      }

      renderDonors(donors);

    } catch (error) {
      console.error(
        'Donor search error:',
        error
      );

      if (resultsBody) {
        resultsBody.innerHTML = `
          <tr>
            <td colspan="5">
              ${escapeHtml(error.message || 'Could not load donors.')}
            </td>
          </tr>
        `;
      }

      if (resultsCount) {
        resultsCount.textContent = '';
      }
    }
  }

  searchForm.addEventListener(
    'submit',
    (event) => {
      event.preventDefault();

      loadDonors();
    }
  );

  if (resetButton) {
    resetButton.addEventListener(
      'click',
      () => {
        searchForm.reset();

        loadDonors();
      }
    );
  }

  loadDonors();
}

const requestForm =
  document.getElementById(
    'request-form'
  );

if (requestForm) {
  const alertBox =
    document.getElementById(
      'request-alert'
    );

  const requestsBody =
    document.getElementById(
      'my-requests-body'
    );

  async function loadMyRequests() {
    const token =
      getToken();

    if (!token) {
      if (requestsBody) {
        requestsBody.innerHTML = `
          <tr>
            <td colspan="7">
              Please
              <a href="login.html">
                login
              </a>
              to view requests.
            </td>
          </tr>
        `;
      }

      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/requests/me`,
        {
          headers:
            authHeaders()
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        if (
          response.status === 401
        ) {
          localStorage.removeItem(
            'token'
          );

          localStorage.removeItem(
            'user'
          );
        }

        throw new Error(
          data.message ||
          'Unable to load requests.'
        );
      }

      const requests =
        data.requests || [];

      if (!requestsBody) {
        return;
      }

      if (
        requests.length === 0
      ) {
        requestsBody.innerHTML = `
          <tr>
            <td colspan="7">
              No blood requests yet.
            </td>
          </tr>
        `;

        return;
      }

      requestsBody.innerHTML =
        requests
          .map(
            (request) => `
              <tr>
                <td>
                  ${escapeHtml(request.patientName)}
                </td>

                <td>
                  ${escapeHtml(request.bloodGroup)}
                </td>

                <td>
                  ${escapeHtml(request.unitsRequired)}
                </td>

                <td>
                  ${escapeHtml(request.hospitalName)}
                </td>

                <td>
                  ${formatDate(
                    request.requiredDate
                  )}
                </td>

                <td>
                  <span class="pill ${statusClass(
                    request.status
                  )}">
                    ${request.status}
                  </span>
                </td>

                <td>
                  ${
                    ['Pending', 'Matched'].includes(request.status)
                      ? `<button type="button" class="btn btn-outline btn-sm cancel-request-btn" data-id="${request._id}">Cancel</button>`
                      : '—'
                  }
                </td>
              </tr>
            `
          )
          .join('');

    } catch (error) {
      console.error(
        'Load request error:',
        error
      );

      if (requestsBody) {
        requestsBody.innerHTML = `
          <tr>
            <td colspan="7">
              ${
                error.message ||
                'Unable to load requests.'
              }
            </td>
          </tr>
        `;
      }
    }
  }

  if (requestsBody) {
    requestsBody.addEventListener(
      'click',
      async (event) => {
        const button = event.target.closest(
          '.cancel-request-btn'
        );

        if (!button) {
          return;
        }

        const id = button.dataset.id;

        if (!id) {
          return;
        }

        if (
          !window.confirm(
            'Cancel this blood request?'
          )
        ) {
          return;
        }

        button.disabled = true;
        button.textContent = 'Cancelling...';

        try {
          const response = await fetch(
            `${API_URL}/requests/${id}`,
            {
              method: 'DELETE',
              headers: authHeaders()
            }
          );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
              'Unable to cancel request.'
            );
          }

          showAlert(
            alertBox,
            'Request cancelled.',
            'success'
          );

          await loadMyRequests();

        } catch (error) {
          console.error(
            'Cancel request error:',
            error
          );

          showAlert(
            alertBox,
            error.message ||
            'Unable to cancel request.',
            'error'
          );

          button.disabled = false;
          button.textContent = 'Cancel';
        }
      }
    );
  }

  requestForm.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      const token =
        getToken();

      if (!token) {
        showAlert(
          alertBox,
          'Please login before submitting a blood request.',
          'error'
        );

        return;
      }

      const patient =
        document.getElementById(
          'req-patient'
        );

      const bloodGroup =
        document.getElementById(
          'req-bloodgroup'
        );

      const units =
        document.getElementById(
          'req-units'
        );

      const hospital =
        document.getElementById(
          'req-hospital'
        );

      const hospitalAddress =
        document.getElementById(
          'req-hospital-address'
        );

      const city =
        document.getElementById(
          'req-city'
        );

      const date =
        document.getElementById(
          'req-date'
        );

      const contact =
        document.getElementById(
          'req-contact'
        );

      const emergency =
        document.getElementById(
          'req-emergency'
        );

      if (
        !patient ||
        !bloodGroup ||
        !units ||
        !hospital ||
        !hospitalAddress ||
        !city ||
        !date ||
        !contact ||
        !emergency
      ) {
        showAlert(
          alertBox,
          'Blood request form fields are missing.',
          'error'
        );

        return;
      }

      if (
        !patient.value.trim() ||
        !hospital.value.trim() ||
        !hospitalAddress.value.trim() ||
        !city.value.trim() ||
        !date.value ||
        !contact.value.trim()
      ) {
        showAlert(
          alertBox,
          'Please complete all required fields.',
          'error'
        );

        return;
      }

      const unitsRequired =
        Number(units.value);

      if (
        !Number.isInteger(
          unitsRequired
        ) ||
        unitsRequired < 1 ||
        unitsRequired > 20
      ) {
        showAlert(
          alertBox,
          'Units must be between 1 and 20.',
          'error'
        );

        return;
      }

      const requestData = {
        patientName:
          patient.value.trim(),

        bloodGroup:
          bloodGroup.value,

        unitsRequired:
          unitsRequired,

        hospitalName:
          hospital.value.trim(),

        hospitalAddress:
          hospitalAddress.value.trim(),

        city:
          city.value.trim(),

        requiredDate:
          date.value,

        urgency:
          emergency.checked
            ? 'Critical'
            : 'Normal',

        contactPhone:
          contact.value.trim(),

        reason: ''
      };

      try {
        const response =
          await fetch(
            `${API_URL}/requests`,
            {
              method: 'POST',

              headers:
                authHeaders(),

              body:
                JSON.stringify(
                  requestData
                )
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          if (
            response.status === 401
          ) {
            localStorage.removeItem(
              'token'
            );

            localStorage.removeItem(
              'user'
            );
          }

          throw new Error(
            data.message ||
            'Unable to submit request.'
          );
        }

        showAlert(
          alertBox,
          'Blood request saved to MongoDB Atlas successfully!',
          'success'
        );

        requestForm.reset();

        units.value = 1;

        await loadMyRequests();

      } catch (error) {
        console.error(
          'Request error:',
          error
        );

        showAlert(
          alertBox,
          error.message ||
          'Unable to submit request.',
          'error'
        );
      }
    }
  );

  loadMyRequests();
}

const adminUsersBody = document.getElementById('admin-users-body');
const adminDonorsBody = document.getElementById('admin-donors-body');
const adminRequestsBody = document.getElementById('admin-requests-body');

let latestAdminUsers = [];
let latestAdminDonors = [];
let latestAdminRequests = [];

function csvSafeValue(cell) {
  const value = cell === null || cell === undefined ? '' : String(cell);
  const protectedValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return protectedValue.replace(/"/g, '""');
}

function downloadCsv(filename, rows) {
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          return `"${csvSafeValue(cell)}"`;
        })
        .join(',')
    )
    .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const exportUsersBtn = document.getElementById('export-users-btn');
if (exportUsersBtn) {
  exportUsersBtn.addEventListener('click', () => {
    if (!latestAdminUsers.length) {
      window.alert('No user data to export yet.');
      return;
    }

    const rows = [['Name', 'Email', 'Role', 'Status']];
    latestAdminUsers.forEach((user) => {
      rows.push([user.name, user.email, user.role, user.status]);
    });
    downloadCsv('users-report.csv', rows);
  });
}

const exportRequestsBtn = document.getElementById('export-requests-btn');
if (exportRequestsBtn) {
  exportRequestsBtn.addEventListener('click', () => {
    if (!latestAdminRequests.length) {
      window.alert('No request data to export yet.');
      return;
    }

    const rows = [[
      'Patient',
      'Requester',
      'Blood Group',
      'Units Required',
      'Units Donated',
      'Hospital',
      'City',
      'Needed By',
      'Status',
      'Matched Donors'
    ]];

    latestAdminRequests.forEach((request) => {
      const matched = (request.matches || [])
        .map((match) => {
          const donorUser = match.donor && match.donor.user ? match.donor.user : {};
          return `${donorUser.name || 'Unknown'} (${match.status})`;
        })
        .join('; ');

      rows.push([
        request.patientName,
        request.requester ? request.requester.name : '',
        request.bloodGroup,
        request.unitsRequired,
        request.donatedUnits || 0,
        request.hospitalName,
        request.city,
        formatDate(request.requiredDate),
        request.status,
        matched
      ]);
    });

    downloadCsv('blood-requests-report.csv', rows);
  });
}

async function loadAdminUsers() {
  if (!adminUsersBody) return;

  try {
    const response = await fetch(`${API_URL}/admin/users`, {
      headers: authHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to load users.');

    const users = data.users || [];
    latestAdminUsers = users;

    if (!users.length) {
      adminUsersBody.innerHTML = '<tr><td colspan="5">No users found.</td></tr>';
      return;
    }

    adminUsersBody.innerHTML = users.map((user) => `
      <tr>
        <td>${escapeHtml(user.name) || '—'}</td>
        <td>${escapeHtml(user.email) || '—'}</td>
        <td>${escapeHtml(user.role) || '—'}</td>
        <td><span class="pill ${statusClass(user.status)}">${escapeHtml(user.status || 'Active')}</span></td>
        <td>
          ${user.role === 'Admin'
            ? 'Admin'
            : `
              <button class="btn btn-sm btn-primary" onclick="updateUserStatus('${user._id}','Approved')">Approve</button>
              <button class="btn btn-sm btn-outline" onclick="updateUserStatus('${user._id}','Rejected')">Reject</button>
            `}
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Admin users error:', error);
    adminUsersBody.innerHTML = `<tr><td colspan="5">${escapeHtml(error.message || 'Unable to load users.')}</td></tr>`;
  }
}

async function updateUserStatus(id, status) {
  try {
    const response = await fetch(`${API_URL}/admin/users/${id}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to update user status');
    alert('User status updated successfully');
    await Promise.all([loadAdminUsers(), loadAdminDonors(), loadAdminStats()]);
    await loadAdminRequests();
  } catch (error) {
    alert(error.message);
  }
}

function donorAvailabilityLabel(donor) {
  if (donor.activelyMatched) return 'Matched';
  return donor.available ? 'Available' : 'Unavailable';
}

async function loadAdminDonors() {
  if (!adminDonorsBody && !adminRequestsBody) return [];

  try {
    const response = await fetch(`${API_URL}/admin/donors`, {
      headers: authHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to load donors.');

    latestAdminDonors = data.donors || [];

    if (adminDonorsBody) {
      if (!latestAdminDonors.length) {
        adminDonorsBody.innerHTML = '<tr><td colspan="7">No donor profiles found.</td></tr>';
      } else {
        adminDonorsBody.innerHTML = latestAdminDonors.map((donor) => {
          const user = donor.user || {};
          const availability = donorAvailabilityLabel(donor);
          const availabilityClass = availability === 'Available'
            ? 'pill-success'
            : availability === 'Matched'
              ? 'pill-warning'
              : 'pill-neutral';

          return `
            <tr>
              <td>${escapeHtml(user.name) || '—'}</td>
              <td><strong>${escapeHtml(donor.bloodGroup) || '—'}</strong></td>
              <td>${escapeHtml(donor.city) || '—'}</td>
              <td>${escapeHtml(user.phone) || '—'}</td>
              <td>${formatDate(donor.lastDonationDate)}</td>
              <td><span class="pill ${availabilityClass}">${availability}</span></td>
              <td>
                <span class="pill ${donor.verified ? 'pill-success' : 'pill-neutral'}">
                  ${donor.verified ? 'Verified' : 'Not verified'}
                </span><br>
                <button class="btn btn-sm btn-outline" style="margin-top:.35rem" onclick="updateDonorVerification('${donor._id}', ${!donor.verified})">
                  ${donor.verified ? 'Remove' : 'Verify'}
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    return latestAdminDonors;
  } catch (error) {
    console.error('Admin donors error:', error);
    if (adminDonorsBody) {
      adminDonorsBody.innerHTML = `<tr><td colspan="7">${escapeHtml(error.message || 'Unable to load donors.')}</td></tr>`;
    }
    return [];
  }
}

async function updateDonorVerification(id, verified) {
  try {
    const response = await fetch(`${API_URL}/admin/donors/${id}/verify`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ verified })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to update donor verification');
    await loadAdminDonors();
    await loadAdminRequests();
  } catch (error) {
    alert(error.message);
  }
}

function compatibleAdminDonors(request) {
  const alreadyUsed = new Set(
    (request.matches || [])
      .map((match) => match.donor && match.donor._id)
      .filter(Boolean)
  );

  return latestAdminDonors
    .filter((donor) => {
      const user = donor.user || {};
      return donor.available === true &&
        donor.activelyMatched !== true &&
        user.status === 'Approved' &&
        donor.bloodGroup === request.bloodGroup &&
        !alreadyUsed.has(donor._id);
    })
    .sort((a, b) => {
      const aSameCity = String(a.city || '').toLowerCase() === String(request.city || '').toLowerCase();
      const bSameCity = String(b.city || '').toLowerCase() === String(request.city || '').toLowerCase();
      if (aSameCity === bSameCity) return 0;
      return aSameCity ? -1 : 1;
    });
}

function renderRequestMatches(request) {
  const matches = request.matches || [];
  if (!matches.length) return '<span class="muted">No donor matched</span>';

  return matches.map((match) => {
    const donor = match.donor || {};
    const donorUser = donor.user || {};
    const donated = match.status === 'Donated';

    return `
      <div style="padding:.45rem 0; border-bottom:1px solid #eee; min-width:190px;">
        <strong>${escapeHtml(donorUser.name) || 'Unknown donor'}</strong><br>
        <small>${escapeHtml(donor.bloodGroup) || '—'} · ${escapeHtml(donor.city) || '—'}</small><br>
        <small>${escapeHtml(donorUser.phone) || '—'}</small><br>
        <span class="pill ${donated ? 'pill-success' : 'pill-warning'}">${escapeHtml(match.status)}</span><br>
        <small>Matched by: ${escapeHtml(match.matchedBy && match.matchedBy.name ? match.matchedBy.name : 'Admin')}</small>
        ${match.status === 'Matched' ? `
          <div style="margin-top:.35rem;">
            <button class="btn btn-sm btn-primary" onclick="updateMatchStatus('${match._id}','Donated')">Confirm Donation</button>
            <button class="btn btn-sm btn-outline" onclick="updateMatchStatus('${match._id}','Cancelled')">Remove</button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function renderRequestAction(request) {
  if (request.status === 'Fulfilled') {
    if (!(request.matches || []).length) {
      return `
        <span class="muted">Legacy fulfillment: no donor was recorded</span><br>
        <button class="btn btn-sm btn-outline" style="margin-top:.4rem" onclick="reopenLegacyRequest('${request._id}')">Reopen for Matching</button>
      `;
    }
    return '<span class="pill pill-success">Completed</span>';
  }
  if (request.status === 'Cancelled') {
    return '<span class="pill pill-neutral">Cancelled</span>';
  }

  const compatible = compatibleAdminDonors(request);
  const canAssign = Number(request.remainingUnits || 0) > 0;
  const selectId = `match-donor-${request._id}`;

  const matcher = canAssign
    ? (compatible.length
      ? `
        <select id="${selectId}" style="min-width:180px; margin-bottom:.4rem;">
          <option value="">Select donor</option>
          ${compatible.map((donor) => {
            const user = donor.user || {};
            const sameCity = String(donor.city || '').toLowerCase() === String(request.city || '').toLowerCase();
            return `<option value="${donor._id}">${escapeHtml(user.name)} — ${escapeHtml(donor.city)}${sameCity ? ' (same city)' : ''}</option>`;
          }).join('')}
        </select>
        <button class="btn btn-sm btn-primary" onclick="matchDonorToRequest('${request._id}','${selectId}')">Match Donor</button>
      `
      : '<span class="muted">No compatible available donor</span>')
    : '<span class="muted">All units assigned</span>';

  return `
    <div>${matcher}</div>
    <button class="btn btn-sm btn-outline" style="margin-top:.4rem" onclick="updateRequestStatus('${request._id}','Cancelled')">Cancel Request</button>
  `;
}

async function loadAdminRequests() {
  if (!adminRequestsBody) return;

  try {
    const response = await fetch(`${API_URL}/admin/requests`, {
      headers: authHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to load requests.');

    const requests = data.requests || [];
    latestAdminRequests = requests;

    if (!requests.length) {
      adminRequestsBody.innerHTML = '<tr><td colspan="8">No blood requests found.</td></tr>';
      return;
    }

    adminRequestsBody.innerHTML = requests.map((request) => {
      const requester = request.requester || {};
      const donatedUnits = Number(request.donatedUnits || 0);
      const assignedUnits = Number(request.assignedUnits || 0);
      const required = Number(request.unitsRequired || 0);

      return `
        <tr>
          <td>
            <strong>${escapeHtml(request.patientName) || '—'}</strong><br>
            <small>By: ${escapeHtml(requester.name) || '—'}</small><br>
            <small>${escapeHtml(requester.phone) || '—'}</small>
          </td>
          <td><strong>${escapeHtml(request.bloodGroup) || '—'}</strong></td>
          <td>${required}</td>
          <td>
            ${escapeHtml(request.hospitalName) || '—'}<br>
            <small>${escapeHtml(request.city) || '—'}</small>
          </td>
          <td>${formatDate(request.requiredDate)}</td>
          <td>
            <span class="pill ${statusClass(request.status)}">${escapeHtml(request.status)}</span><br>
            <small>${donatedUnits}/${required} donated</small><br>
            <small>${assignedUnits}/${required} assigned</small>
          </td>
          <td>${renderRequestMatches(request)}</td>
          <td>${renderRequestAction(request)}</td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Admin requests error:', error);
    adminRequestsBody.innerHTML = `<tr><td colspan="8">${escapeHtml(error.message || 'Unable to load requests.')}</td></tr>`;
  }
}

async function matchDonorToRequest(requestId, selectId) {
  const select = document.getElementById(selectId);
  const donorId = select ? select.value : '';
  if (!donorId) {
    alert('Please select an available donor first.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/admin/requests/${requestId}/match`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ donorId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to match donor');
    alert(data.message || 'Donor matched successfully');
    await loadAdminDonors();
    await Promise.all([loadAdminRequests(), loadAdminStats()]);
  } catch (error) {
    alert(error.message);
  }
}

async function updateMatchStatus(matchId, status) {
  const actionText = status === 'Donated' ? 'confirm this donation' : 'remove this donor match';
  if (!window.confirm(`Are you sure you want to ${actionText}?`)) return;

  try {
    const response = await fetch(`${API_URL}/admin/matches/${matchId}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to update donor match');
    alert(data.message || 'Match updated');
    await loadAdminDonors();
    await Promise.all([loadAdminRequests(), loadAdminStats()]);
  } catch (error) {
    alert(error.message);
  }
}

async function reopenLegacyRequest(id) {
  if (!window.confirm('Reopen this old fulfilled request so a real donor can be matched?')) return;

  try {
    const response = await fetch(`${API_URL}/admin/requests/${id}/reopen`, {
      method: 'PUT',
      headers: authHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to reopen request');
    alert(data.message || 'Request reopened');
    await Promise.all([loadAdminRequests(), loadAdminStats()]);
  } catch (error) {
    alert(error.message);
  }
}

async function updateRequestStatus(id, status) {
  if (status === 'Cancelled' && !window.confirm('Cancel this blood request?')) return;

  try {
    const response = await fetch(`${API_URL}/admin/requests/${id}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to update request status');
    alert(data.message || 'Request updated');
    await loadAdminDonors();
    await Promise.all([loadAdminRequests(), loadAdminStats()]);
  } catch (error) {
    alert(error.message);
  }
}

async function loadAdminStats() {
  const totalUsers = document.getElementById('stat-total-users');
  const totalDonors = document.getElementById('stat-total-donors');
  const availableDonors = document.getElementById('stat-available-donors');
  const pendingRequests = document.getElementById('stat-pending-requests');
  const matchedRequests = document.getElementById('stat-matched-requests');
  const emergencyRequests = document.getElementById('stat-emergency');

  if (!totalUsers && !totalDonors && !availableDonors && !pendingRequests && !matchedRequests && !emergencyRequests) return;

  try {
    const response = await fetch(`${API_URL}/admin/stats`, {
      headers: authHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to load stats.');

    const stats = data.stats || {};
    if (totalUsers) totalUsers.textContent = stats.totalUsers || 0;
    if (totalDonors) totalDonors.textContent = stats.totalDonors || 0;
    if (availableDonors) availableDonors.textContent = stats.availableDonors || 0;
    if (pendingRequests) pendingRequests.textContent = stats.pendingRequests || 0;
    if (matchedRequests) matchedRequests.textContent = stats.matchedRequests || 0;
    if (emergencyRequests) emergencyRequests.textContent = stats.emergencyRequests || 0;
  } catch (error) {
    console.error('Admin stats error:', error);
  }
}

const adminTabs = document.querySelectorAll('.tab-btn');
if (adminTabs.length > 0) {
  adminTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      adminTabs.forEach((item) => item.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  loadAdminUsers();
  loadAdminStats();
  loadAdminDonors().then(() => loadAdminRequests());
}


const logoutButtons =
  document.querySelectorAll(
    '.logout-btn, #logout-btn'
  );

logoutButtons.forEach(
  (button) => {
    button.addEventListener(
      'click',
      logoutUser
    );
  }
);


const accountProfileForm = document.getElementById(
  'account-profile-form'
);

const accountPasswordForm = document.getElementById(
  'account-password-form'
);

if (accountProfileForm || accountPasswordForm) {

  if (!getToken()) {
    window.location.href = 'login.html';
  }

  const nameInput = document.getElementById('account-name');
  const emailInput = document.getElementById('account-email');
  const phoneInput = document.getElementById('account-phone');

  const storedUser = getStoredUser();

  if (storedUser) {
    if (nameInput) nameInput.value = storedUser.name || '';
    if (emailInput) emailInput.value = storedUser.email || '';
    if (phoneInput) phoneInput.value = storedUser.phone || '';
  }

  const profileAlert = document.getElementById(
    'account-profile-alert'
  );

  if (accountProfileForm) {
    accountProfileForm.addEventListener(
      'submit',
      async (event) => {
        event.preventDefault();

        let isValid = true;

        if (nameInput.value.trim().length < 3) {
          setFieldError(
            nameInput,
            'Please enter your full name (at least 3 characters).'
          );
          isValid = false;
        } else {
          setFieldError(nameInput, '');
        }

        const phonePattern = /^[0-9+\-\s]{7,15}$/;

        if (!phonePattern.test(phoneInput.value.trim())) {
          setFieldError(
            phoneInput,
            'Please enter a valid phone number.'
          );
          isValid = false;
        } else {
          setFieldError(phoneInput, '');
        }

        if (!isValid) {
          showAlert(
            profileAlert,
            'Please fix the form errors.',
            'error'
          );
          return;
        }

        try {
          const response = await fetch(
            `${API_URL}/auth/me`,
            {
              method: 'PUT',
              headers: authHeaders(),
              body: JSON.stringify({
                name: nameInput.value.trim(),
                phone: phoneInput.value.trim()
              })
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.message || 'Unable to update profile.'
            );
          }

          localStorage.setItem(
            'user',
            JSON.stringify(data.user)
          );

          showAlert(
            profileAlert,
            'Profile updated successfully.',
            'success'
          );

          updateNavbarAuth();

        } catch (error) {
          console.error('Update profile error:', error);

          showAlert(
            profileAlert,
            error.message || 'Unable to update profile.',
            'error'
          );
        }
      }
    );
  }

  const passwordAlert = document.getElementById(
    'account-password-alert'
  );

  if (accountPasswordForm) {
    accountPasswordForm.addEventListener(
      'submit',
      async (event) => {
        event.preventDefault();

        const currentPassword = document.getElementById(
          'account-current-password'
        );

        const newPassword = document.getElementById(
          'account-new-password'
        );

        const confirmPassword = document.getElementById(
          'account-confirm-password'
        );

        let isValid = true;

        if (!currentPassword.value) {
          setFieldError(
            currentPassword,
            'Please enter your current password.'
          );
          isValid = false;
        } else {
          setFieldError(currentPassword, '');
        }

        if (newPassword.value.length < 6) {
          setFieldError(
            newPassword,
            'New password must be at least 6 characters.'
          );
          isValid = false;
        } else {
          setFieldError(newPassword, '');
        }

        if (confirmPassword.value !== newPassword.value) {
          setFieldError(
            confirmPassword,
            'Passwords do not match.'
          );
          isValid = false;
        } else {
          setFieldError(confirmPassword, '');
        }

        if (!isValid) {
          showAlert(
            passwordAlert,
            'Please fix the form errors.',
            'error'
          );
          return;
        }

        try {
          const response = await fetch(
            `${API_URL}/auth/change-password`,
            {
              method: 'PUT',
              headers: authHeaders(),
              body: JSON.stringify({
                currentPassword: currentPassword.value,
                newPassword: newPassword.value
              })
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.message || 'Unable to change password.'
            );
          }

          showAlert(
            passwordAlert,
            'Password changed successfully.',
            'success'
          );

          accountPasswordForm.reset();

        } catch (error) {
          console.error('Change password error:', error);

          showAlert(
            passwordAlert,
            error.message || 'Unable to change password.',
            'error'
          );
        }
      }
    );
  }
}
