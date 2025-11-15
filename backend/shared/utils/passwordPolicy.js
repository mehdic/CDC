"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCommonPassword = isCommonPassword;
exports.estimatePasswordStrengthAdvanced = estimatePasswordStrengthAdvanced;
exports.isPasswordReused = isPasswordReused;
exports.addToPasswordHistory = addToPasswordHistory;
exports.checkPasswordExpiration = checkPasswordExpiration;
exports.validatePasswordComprehensive = validatePasswordComprehensive;
exports.generateCompliantPassword = generateCompliantPassword;
const auth_1 = require("./auth");
const security_1 = require("../config/security");
const COMMON_PASSWORDS_SUBSET = [
    'password',
    '123456',
    '123456789',
    '12345678',
    '12345',
    'qwerty',
    'abc123',
    'password1',
    '1234567',
    '123123',
    '1234567890',
    '000000',
    'password123',
    '1q2w3e4r',
    'qwertyuiop',
    'monkey',
    'dragon',
    'letmein',
    'trustno1',
    'sunshine',
    'master',
    'welcome',
    'shadow',
    'ashley',
    '123321',
    'football',
    'jesus',
    'michael',
    'ninja',
    'mustang',
    'password1!',
    'superman',
    'admin',
    'root',
    'test',
    'guest',
    'changeme',
    'Welcome1',
    'Passw0rd',
    'Admin123',
    'P@ssw0rd',
    'Password1!',
    'Qwerty123',
    'Summer2023',
    'Winter2023',
    'Spring2023',
    'Fall2023',
    'January2023',
    'February2023',
    'March2023',
    'April2023',
    'May2023',
    'June2023',
    'July2023',
    'August2023',
    'September2023',
    'October2023',
    'November2023',
    'December2023',
    'Monday123',
    'Tuesday123',
    'Wednesday123',
    'Thursday123',
    'Friday123',
    'Saturday123',
    'Sunday123',
    'baseball',
    'freedom',
    'whatever',
    'jordan',
    'robert',
    'thomas',
    'daniel',
    'jennifer',
    'matthew',
    'michelle',
    'jessica',
    'anthony',
    'amanda',
    'melissa',
    'stephanie',
    'joseph',
    'nicole',
    'christopher',
    'william',
    'elizabeth',
    'heather',
    'samantha',
    'melissa',
    'christina',
    'lauren',
    'brittany',
    'taylor',
    'ashley',
    'megan',
    'emily',
    'sarah',
];
function isCommonPassword(password) {
    if (!password)
        return false;
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS_SUBSET.includes(lowerPassword)) {
        return true;
    }
    const containsCommon = COMMON_PASSWORDS_SUBSET.some((common) => lowerPassword.includes(common.toLowerCase()));
    return containsCommon;
}
function estimatePasswordStrengthAdvanced(password) {
    if (!password) {
        return {
            score: 0,
            crackTimeSeconds: 0,
            feedback: ['Password is empty'],
            suggestions: ['Create a strong password with at least 12 characters'],
        };
    }
    let score = 0;
    const feedback = [];
    const suggestions = [];
    if (isCommonPassword(password)) {
        return {
            score: 0,
            crackTimeSeconds: 1,
            feedback: ['This is a very common password'],
            suggestions: [
                'Use a unique password that is not in common password lists',
                'Combine random words with numbers and symbols',
            ],
        };
    }
    if (password.length >= 12)
        score += 1;
    if (password.length >= 16)
        score += 1;
    if (password.length < 12) {
        feedback.push('Password is too short');
        suggestions.push('Use at least 12 characters');
    }
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const diversityCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
    if (diversityCount >= 3)
        score += 1;
    if (diversityCount === 4)
        score += 1;
    if (!hasUpper)
        suggestions.push('Add uppercase letters');
    if (!hasLower)
        suggestions.push('Add lowercase letters');
    if (!hasDigit)
        suggestions.push('Add numbers');
    if (!hasSpecial)
        suggestions.push('Add special characters');
    if (hasRepeatingCharacters(password)) {
        score -= 1;
        feedback.push('Contains repeating characters');
        suggestions.push('Avoid repeating the same character multiple times');
    }
    if (hasSequentialCharacters(password)) {
        score -= 1;
        feedback.push('Contains sequential characters (abc, 123)');
        suggestions.push('Avoid sequential patterns');
    }
    if (hasKeyboardWalk(password)) {
        score -= 1;
        feedback.push('Contains keyboard patterns (qwerty, asdf)');
        suggestions.push('Avoid keyboard walks');
    }
    const entropy = calculatePasswordEntropy(password);
    if (entropy >= 60)
        score += 1;
    score = Math.max(0, Math.min(4, score));
    const crackTimeSeconds = estimateCrackTime(password, entropy);
    if (score === 0) {
        feedback.push('Very weak password - easily cracked in seconds');
    }
    else if (score === 1) {
        feedback.push('Weak password - can be cracked in minutes to hours');
    }
    else if (score === 2) {
        feedback.push('Fair password - may take days to crack');
    }
    else if (score === 3) {
        feedback.push('Strong password - would take years to crack');
    }
    else if (score === 4) {
        feedback.push('Very strong password - would take centuries to crack');
    }
    return {
        score,
        crackTimeSeconds,
        feedback,
        suggestions,
    };
}
function hasRepeatingCharacters(password) {
    return /(.)\1{2,}/.test(password);
}
function hasSequentialCharacters(password) {
    const sequences = ['abc', '123', 'xyz', '789', 'bcd', 'cde', 'def'];
    for (const seq of sequences) {
        if (password.toLowerCase().includes(seq)) {
            return true;
        }
        if (password.toLowerCase().includes(seq.split('').reverse().join(''))) {
            return true;
        }
    }
    return false;
}
function hasKeyboardWalk(password) {
    const keyboards = ['qwerty', 'asdfgh', 'zxcvbn', 'qwertz'];
    for (const kb of keyboards) {
        if (password.toLowerCase().includes(kb)) {
            return true;
        }
    }
    return false;
}
function calculatePasswordEntropy(password) {
    let poolSize = 0;
    if (/[a-z]/.test(password))
        poolSize += 26;
    if (/[A-Z]/.test(password))
        poolSize += 26;
    if (/\d/.test(password))
        poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(password))
        poolSize += 32;
    return Math.log2(Math.pow(poolSize, password.length));
}
function estimateCrackTime(password, entropy) {
    const guessesPerSecond = 10_000_000_000;
    const possibleCombinations = Math.pow(2, entropy);
    return possibleCombinations / guessesPerSecond / 2;
}
async function isPasswordReused(newPassword, previousPasswordHashes) {
    if (!previousPasswordHashes || previousPasswordHashes.length === 0) {
        return false;
    }
    for (const hash of previousPasswordHashes) {
        const isMatch = await (0, auth_1.comparePassword)(newPassword, hash);
        if (isMatch) {
            return true;
        }
    }
    return false;
}
function addToPasswordHistory(newPasswordHash, currentHistory, maxHistory = 5) {
    const updated = [newPasswordHash, ...currentHistory];
    return updated.slice(0, maxHistory);
}
function checkPasswordExpiration(lastPasswordChange, expirationDays = 90) {
    const now = new Date();
    const daysSinceChange = Math.floor((now.getTime() - lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = expirationDays - daysSinceChange;
    return {
        isExpired: daysRemaining <= 0,
        daysRemaining: Math.max(0, daysRemaining),
        shouldWarn: daysRemaining <= 7 && daysRemaining > 0,
    };
}
async function validatePasswordComprehensive(password, options) {
    const errors = [];
    const warnings = [];
    const config = (0, security_1.getPasswordPolicyConfig)();
    if (password.length < config.minLength) {
        errors.push(`Password must be at least ${config.minLength} characters long`);
    }
    if (password.length > config.maxLength) {
        errors.push(`Password must not exceed ${config.maxLength} characters`);
    }
    if (config.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (config.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (config.requireDigits && !/\d/.test(password)) {
        errors.push('Password must contain at least one digit');
    }
    if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    if (config.preventCommonPasswords && isCommonPassword(password)) {
        errors.push('Password is too common. Please choose a more unique password.');
    }
    if (options?.userEmail) {
        const emailLocal = options.userEmail.split('@')[0].toLowerCase();
        if (password.toLowerCase().includes(emailLocal)) {
            errors.push('Password should not contain your email address');
        }
    }
    if (options?.userName) {
        if (password.toLowerCase().includes(options.userName.toLowerCase())) {
            errors.push('Password should not contain your name');
        }
    }
    if (options?.previousPasswordHashes && config.passwordHistoryCount > 0) {
        const isReused = await isPasswordReused(password, options.previousPasswordHashes.slice(0, config.passwordHistoryCount));
        if (isReused) {
            errors.push(`Password was used recently. Cannot reuse any of your last ${config.passwordHistoryCount} passwords.`);
        }
    }
    const strength = estimatePasswordStrengthAdvanced(password);
    if (strength.score < 2) {
        warnings.push('Password strength is low. Consider making it stronger.');
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        strength: {
            score: strength.score,
            feedback: strength.feedback,
            suggestions: strength.suggestions,
        },
    };
}
function generateCompliantPassword(length = 16) {
    const config = (0, security_1.getPasswordPolicyConfig)();
    length = Math.max(length, config.minLength);
    length = Math.min(length, config.maxLength);
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}';
    let password = '';
    let allChars = '';
    if (config.requireLowercase) {
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        allChars += lowercase;
    }
    if (config.requireUppercase) {
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        allChars += uppercase;
    }
    if (config.requireDigits) {
        password += digits[Math.floor(Math.random() * digits.length)];
        allChars += digits;
    }
    if (config.requireSpecialChars) {
        password += special[Math.floor(Math.random() * special.length)];
        allChars += special;
    }
    const remainingLength = length - password.length;
    for (let i = 0; i < remainingLength; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    password = password
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('');
    if (isCommonPassword(password)) {
        return generateCompliantPassword(length);
    }
    return password;
}
//# sourceMappingURL=passwordPolicy.js.map