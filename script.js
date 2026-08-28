const API_URL = 'http://localhost:5000/api';
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

function getToken() {
  return localStorage.getItem('token');
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

function authHeaders() {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  return headers;
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
    status === 'Available'
  ) {
    return 'pill-success';
  }

  if (
    status === 'Pending' ||
    status === 'Critical'
  ) {
    return 'pill-warning';
  }

  return 'pill-neutral';
}

function updateNavbarAuth() {
  
  const navActions =
    document.querySelector('.nav-actions');

  if (!navActions) {
    return;
  }

  const token =
    localStorage.getItem('token');

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem('user')
    );
  } catch (error) {
    user = null;
  }

  if (!token || !user) {
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


  let profilePage = 'request.html';

  if (user.role === 'Donor') {
    profilePage = 'donor.html';
  }

  if (user.role === 'Admin') {
    profilePage = 'admin.html';
  }

  const displayName =
    user.name || 'Profile';

  navActions.innerHTML = `
    <a
      href="${profilePage}"
      class="btn btn-outline btn-sm"
    >
      👤 ${displayName}
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
      () => {
        localStorage.removeItem(
          'token'
        );

        localStorage.removeItem(
          'user'
        );

        window.location.href =
          'login.html';
      }
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

      const password =
        document.getElementById(
          'reg-password'
        );

      const confirm =
        document.getElementById(
          'reg-confirm'
        );

      const role = null;

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
          'Registration successful! You can now login.',
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

        if (!data.token) {
          throw new Error(
            'Login succeeded but no token was returned.'
          );
        }

        localStorage.setItem(
          'token',
          data.token
        );

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
          donor.available !== false;
      }

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
        !availableEl
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

        available:
          availableEl.checked
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
          'Donor profile saved to MongoDB Atlas successfully!',
          'success'
        );

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
                ${user.name || '—'}
              </td>

              <td>
                ${donor.bloodGroup || '—'}
              </td>

              <td>
                ${donor.city || '—'}
              </td>

              <td>
                ${user.phone || '—'}
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
              Could not load donors.
              Make sure the backend server is running.
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
            <td colspan="6">
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
            <td colspan="6">
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
                  ${request.patientName}
                </td>

                <td>
                  ${request.bloodGroup}
                </td>

                <td>
                  ${request.unitsRequired}
                </td>

                <td>
                  ${request.hospitalName}
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
            <td colspan="6">
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
        unitsRequired < 1
      ) {
        showAlert(
          alertBox,
          'Units must be at least 1.',
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

        reason:
          `Contact: ${
            contact.value.trim()
          }`
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

const adminUsersBody =
  document.getElementById(
    'admin-users-body'
  );

const adminRequestsBody =
  document.getElementById(
    'admin-requests-body'
  );

async function loadAdminUsers() {

  if (!adminUsersBody) {
    return;
  }


  if (!getToken()) {

    adminUsersBody.innerHTML = `
      <tr>
        <td colspan="5">
          Please login as Admin.
        </td>
      </tr>
    `;

    return;
  }


  try {

    const response = await fetch(
      `${API_URL}/admin/users`,
      {
        headers:
          authHeaders()
      }
    );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.message ||
        'Unable to load users.'
      );

    }


    const users =
      data.users || [];



    if (users.length === 0) {

      adminUsersBody.innerHTML = `
        <tr>
          <td colspan="5">
            No users found.
          </td>
        </tr>
      `;

      return;

    }



    adminUsersBody.innerHTML =
      users
        .map(
          (user) => `

            <tr>

              <td>
                ${user.name || '—'}
              </td>


              <td>
                ${user.email || '—'}
              </td>


              <td>
                ${user.role || '—'}
              </td>


              <td>

                <span class="pill ${statusClass(
                  user.status
                )}">

                  ${
                    user.status ||
                    'Active'
                  }

                </span>

              </td>


              <td>

              ${
                user.role === "Admin"

                ?

                "Admin"

                :

                `

                <button
                class="btn btn-sm btn-primary"
                onclick="updateUserStatus('${user._id}','Approved')">

                Approve

                </button>


                <button
                class="btn btn-sm btn-outline"
                onclick="updateUserStatus('${user._id}','Rejected')">

                Reject

                </button>

                `

              }


              </td>


            </tr>

          `
        )
        .join('');



  } catch (error) {


    console.error(
      'Admin users error:',
      error
    );


    adminUsersBody.innerHTML = `

      <tr>

        <td colspan="5">

          ${
            error.message ||
            'Unable to load users.'
          }

        </td>

      </tr>

    `;

  }

}

async function updateUserStatus(id, status) {

    try {

        const response = await fetch(
            `${API_URL}/admin/users/${id}/status`,
            {
                method: "PUT",

                headers: authHeaders(),

                body: JSON.stringify({
                    status: status
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to update user status"
            );

        }


        alert(
            "User status updated successfully"
        );


        loadAdminUsers();


    } catch (error) {

        alert(
            error.message
        );

    }

}

async function loadAdminRequests() {

    if (!adminRequestsBody) {
        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/admin/requests`,
            {
                headers: authHeaders()
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load requests."
            );

        }


        const requests =
            data.requests || [];


        if (requests.length === 0) {

            adminRequestsBody.innerHTML = `
            <tr>
                <td colspan="7">
                    No blood requests found.
                </td>
            </tr>
            `;

            return;

        }



        adminRequestsBody.innerHTML =
            requests.map(
                (request) => `

                <tr>

                    <td>
                        ${request.patientName || '—'}
                    </td>


                    <td>
                        ${request.bloodGroup || '—'}
                    </td>


                    <td>
                        ${request.unitsRequired || '—'}
                    </td>


                    <td>
                        ${request.hospitalName || '—'}
                    </td>


                    <td>
                        ${request.city || '—'}
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

<br>

${
  request.status === "Pending"

  ?

  `
  <button
  class="btn btn-sm btn-primary"
  onclick="updateRequestStatus('${request._id}','Fulfilled')">
  Fulfill
  </button>


  <button
  class="btn btn-sm btn-outline"
  onclick="updateRequestStatus('${request._id}','Cancelled')">
  Cancel
  </button>
  `

  :

  "—"
}

</td>

                </tr>

                `
            ).join('');



    } catch(error) {

        console.error(
            "Admin requests error:",
            error
        );

    }

}

async function updateRequestStatus(id, status) {

    try {

        const response = await fetch(
            `${API_URL}/admin/requests/${id}/status`,
            {
                method: "PUT",

                headers: authHeaders(),

                body: JSON.stringify({
                    status: status
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to update request status"
            );

        }


        alert(
            "Request status updated successfully"
        );


        loadAdminRequests();


    } catch (error) {

        alert(
            error.message
        );

    }

}
async function loadAdminStats() {
  const totalUsers =
    document.getElementById(
      'stat-total-users'
    );

  const totalDonors =
    document.getElementById(
      'stat-total-donors'
    );

  const pendingRequests =
    document.getElementById(
      'stat-pending-requests'
    );

  if (
    !totalUsers &&
    !totalDonors &&
    !pendingRequests
  ) {
    return;
  }

  if (!getToken()) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/admin/stats`,
      {
        headers:
          authHeaders()
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        'Unable to load stats.'
      );
    }

    const stats =
      data.stats || {};

    if (totalUsers) {
      totalUsers.textContent =
        stats.totalUsers || 0;
    }

    if (totalDonors) {
      totalDonors.textContent =
        stats.totalDonors || 0;
    }

    if (pendingRequests) {
      pendingRequests.textContent =
        stats.pendingRequests || 0;
    }

  } catch (error) {
    console.error(
      'Admin stats error:',
      error
    );
  }
}

const adminTabs =
  document.querySelectorAll(
    '.tab-btn'
  );

if (adminTabs.length > 0) {
  adminTabs.forEach(
    (tab) => {
      tab.addEventListener(
        'click',
        () => {
          adminTabs.forEach(
            (item) => {
              item.classList.remove(
                'active'
              );
            }
          );

          document
            .querySelectorAll(
              '.tab-panel'
            )
            .forEach(
              (panel) => {
                panel.classList.remove(
                  'active'
                );
              }
            );

          tab.classList.add(
            'active'
          );

          const target =
            document.getElementById(
              tab.dataset.tab
            );

          if (target) {
            target.classList.add(
              'active'
            );
          }
        }
      );
    }
  );

  loadAdminUsers();
  loadAdminRequests();
  loadAdminStats();
}

const logoutButtons =
  document.querySelectorAll(
    '.logout-btn, #logout-btn'
  );

logoutButtons.forEach(
  (button) => {
    button.addEventListener(
      'click',
      () => {
        localStorage.removeItem(
          'token'
        );

        localStorage.removeItem(
          'user'
        );

        window.location.href =
          'login.html';
      }
    );
  }
);