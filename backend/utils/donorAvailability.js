const Donor = require("../models/Donor");
const DonationMatch = require("../models/DonationMatch");

const MIN_DAYS_SINCE_LAST_DONATION = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function daysSince(dateValue) {
    const date = parseDate(dateValue);
    if (!date) return null;
    return Math.floor((Date.now() - date.getTime()) / DAY_MS);
}

function isDonationIntervalEligible(lastDonationDate) {
    if (!lastDonationDate) return true;
    const days = daysSince(lastDonationDate);
    return days !== null && days >= MIN_DAYS_SINCE_LAST_DONATION;
}

function getRequestedAvailability(donor) {
    if (typeof donor.availabilityRequested === "boolean") {
        return donor.availabilityRequested;
    }


    if (!isDonationIntervalEligible(donor.lastDonationDate)) {
        return true;
    }

    return donor.available !== false;
}

function buildAvailabilityStatus(donor, activelyMatched = false) {
    const requestedAvailability = getRequestedAvailability(donor);
    const days = daysSince(donor.lastDonationDate);
    const eligibleByInterval = isDonationIntervalEligible(donor.lastDonationDate);
    const daysRemaining = eligibleByInterval || days === null
        ? 0
        : Math.max(0, MIN_DAYS_SINCE_LAST_DONATION - days);

    return {
        requestedAvailability,
        eligibleByInterval,
        activelyMatched,
        daysSinceLastDonation: days,
        daysRemaining,
        available: Boolean(donor.available)
    };
}

async function syncDonorAvailability(donor, options = {}) {
    if (!donor) return null;

    const requestedAvailability = getRequestedAvailability(donor);
    const eligibleByInterval = isDonationIntervalEligible(donor.lastDonationDate);

    let userStatus = options.userStatus;
    if (!userStatus && donor.user && donor.user.status) {
        userStatus = donor.user.status;
    }

    let activelyMatched = options.activelyMatched;
    if (activelyMatched === undefined) {
        activelyMatched = Boolean(
            await DonationMatch.exists({
                donor: donor._id,
                status: "Matched"
            })
        );
    }

    const shouldBeAvailable = Boolean(
        requestedAvailability &&
        eligibleByInterval &&
        userStatus === "Approved" &&
        !activelyMatched
    );

    let changed = false;

    if (donor.availabilityRequested !== requestedAvailability) {
        donor.availabilityRequested = requestedAvailability;
        changed = true;
    }

    if (donor.available !== shouldBeAvailable) {
        donor.available = shouldBeAvailable;
        changed = true;
    }

    if (changed && options.save !== false) {
        await donor.save();
    }

    return buildAvailabilityStatus(donor, activelyMatched);
}

async function refreshAllDonorAvailability() {
    const donors = await Donor.find().populate("user", "status");
    const activeMatches = await DonationMatch.find({ status: "Matched" }).select("donor");
    const busyDonorIds = new Set(
        activeMatches.map((match) => match.donor.toString())
    );

    await Promise.all(
        donors.map((donor) => syncDonorAvailability(donor, {
            userStatus: donor.user ? donor.user.status : null,
            activelyMatched: busyDonorIds.has(donor._id.toString())
        }))
    );
}

module.exports = {
    MIN_DAYS_SINCE_LAST_DONATION,
    daysSince,
    isDonationIntervalEligible,
    getRequestedAvailability,
    buildAvailabilityStatus,
    syncDonorAvailability,
    refreshAllDonorAvailability
};
