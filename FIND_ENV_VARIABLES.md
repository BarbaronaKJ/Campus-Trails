# Where to Find Environment Variables

## 📍 Current Location

All environment variables are stored in:
```
backend/.env
```

**Note**: This file is gitignored (not in Git) for security reasons.

## ✅ Quick Check

View all your environment variables:
```bash
cat backend/.env
```

Or view specific variables:
```bash
cat backend/.env | grep JWT_SECRET
cat backend/.env | grep EMAIL
```

## 🔐 Environment Variables Guide

### 1. JWT_SECRET

**What it is:** Secret key used to sign and verify JWT tokens for user authentication.

**Where to find it:**
- File: `backend/.env`
- Line: `JWT_SECRET=your-secret-here`

**If you don't have it, generate one:**
```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 64

# Option 3: Online generator
# Visit: https://randomkeygen.com/
```

**Example:**
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**For Render:** Copy the value from `backend/.env` and add it as an environment variable.

---

### 2. EMAIL_HOST

**What it is:** SMTP server hostname for sending emails (password reset, etc.).

**Where to find it:**
- File: `backend/.env`
- Line: `EMAIL_HOST=smtp.gmail.com`

**Common values:**
- **Gmail**: `smtp.gmail.com`
- **Outlook/Hotmail**: `smtp-mail.outlook.com`
- **Yahoo**: `smtp.mail.yahoo.com`
- **Custom SMTP**: Check your email provider's documentation

**Example:**
```env
EMAIL_HOST=smtp.gmail.com
```

**For Render:** Use the same value from `backend/.env`.

---

### 3. EMAIL_PORT

**What it is:** SMTP server port number.

**Where to find it:**
- File: `backend/.env`
- Line: `EMAIL_PORT=587`

**Common values:**
- **587**: TLS (recommended, most common)
- **465**: SSL
- **25**: Unencrypted (not recommended)

**Example:**
```env
EMAIL_PORT=587
```

**For Render:** Use the same value from `backend/.env`.

---

### 4. EMAIL_USER

**What it is:** Your email address used to send emails.

**Where to find it:**
- File: `backend/.env`
- Line: `EMAIL_USER=your-email@gmail.com`

**Example:**
```env
EMAIL_USER=your-email@gmail.com
```

**For Render:** Use the same value from `backend/.env`.

---

### 5. EMAIL_PASS

**What it is:** Password or app-specific password for your email account.

**Where to find it:**
- File: `backend/.env`
- Line: `EMAIL_PASS=your-password-or-app-password`

**Important Notes:**

#### For Gmail:
1. **Enable 2-Step Verification:**
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Click "Generate"
   - **Copy the 16-character password** (no spaces)
   - Use this as `EMAIL_PASS` (NOT your regular Gmail password)

#### For Outlook/Hotmail:
- Use your regular email password
- Or create an app password if 2FA is enabled

#### For Other Providers:
- Check your email provider's documentation for app passwords or SMTP authentication

**Example:**
```env
EMAIL_PASS=abcd efgh ijkl mnop  # Gmail app password (16 chars, no spaces)
# OR
EMAIL_PASS=your-regular-password  # For other providers
```

**For Render:** Copy the value from `backend/.env` and add it as an environment variable.

---

## 📋 Complete .env File Example

Your `backend/.env` should look like this:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campus-trails?retryWrites=true&w=majority

# JWT Secret (generate a secure random string)
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# CORS Origins
CORS_ORIGINS=*

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
```

---

## 🚀 For Render Deployment

### Step 1: Copy All Values

1. Open `backend/.env` in your editor
2. Copy each value:
   - `JWT_SECRET`
   - `EMAIL_HOST`
   - `EMAIL_PORT`
   - `EMAIL_USER`
   - `EMAIL_PASS`

### Step 2: Add to Render

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Click on your service (or create new one)

2. **Go to Environment Tab:**
   - Click "Environment" in the left sidebar

3. **Add Each Variable:**
   - Click "Add Environment Variable"
   - Add each one:
     - **Key**: `JWT_SECRET` → **Value**: (paste from .env)
     - **Key**: `EMAIL_HOST` → **Value**: (paste from .env)
     - **Key**: `EMAIL_PORT` → **Value**: (paste from .env)
     - **Key**: `EMAIL_USER` → **Value**: (paste from .env)
     - **Key**: `EMAIL_PASS` → **Value**: (paste from .env)
   - Click "Save Changes" after each

4. **Verify:**
   - All variables should be listed in the Environment tab
   - Make sure no values are empty

---

## 🔍 How to View Your Current Values

### View All Variables:
```bash
cd backend
cat .env
```

### View Specific Variable:
```bash
# JWT_SECRET
cat backend/.env | grep "^JWT_SECRET="

# All EMAIL variables
cat backend/.env | grep "^EMAIL"
```

### View Without Showing Values (for security):
```bash
cat backend/.env | sed 's/=.*/=***HIDDEN***/'
```

---

## 🆘 Troubleshooting

### "JWT_SECRET is not set"
- Make sure `JWT_SECRET=` line exists in `backend/.env`
- Check there's no space around the `=` sign
- Restart your backend server after adding it

### "Email authentication failed"
- **For Gmail**: Make sure you're using an App Password, not your regular password
- **For Outlook**: Check if 2FA is enabled (may need app password)
- Verify `EMAIL_USER` and `EMAIL_PASS` are correct
- Check `EMAIL_HOST` and `EMAIL_PORT` match your provider

### "Can't send email"
- Check firewall allows SMTP ports (587, 465)
- Verify email provider allows SMTP access
- Check email provider's security settings
- Some providers require enabling "Less secure app access" (not recommended, use app passwords instead)

---

## 📚 Related Documentation

- **Email Setup**: See `backend/FORGOT_PASSWORD_SETUP.md`
- **MongoDB Setup**: See `FIND_MONGODB_URI.md`
- **Render Deployment**: See `RENDER_DEPLOYMENT.md`
- **Backend Setup**: See `backend/README.md`

---

## ⚠️ Security Best Practices

1. **Never commit `.env` to Git** - It's already in `.gitignore`
2. **Never share your environment variables** publicly
3. **Use strong, random JWT_SECRET** (at least 32 characters)
4. **Use app passwords** instead of regular passwords for email
5. **Rotate secrets regularly** in production
6. **Use different values** for development and production
