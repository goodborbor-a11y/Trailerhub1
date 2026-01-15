# 🔐 How to Connect to Your VPS from Windows

## Method 1: PowerShell (Easiest - Built into Windows)

### Step 1: Open PowerShell
1. Press `Windows Key + X`
2. Click **"Windows PowerShell"** or **"Terminal"**
3. Or search for "PowerShell" in Start menu

### Step 2: Connect via SSH
```powershell
ssh root@62.171.149.223
```

### Step 3: Accept the Security Warning
When you see this message:
```
The authenticity of host '62.171.149.223' can't be established.
Are you sure you want to continue connecting (yes/no)?
```
Type: `yes` and press Enter

### Step 4: Enter Password
When prompted for password, type:
```
B2e64X3kg9J
```
**Note:** The password won't show as you type (this is normal for security)

Press Enter after typing the password.

### Step 5: You're In! 🎉
You should see something like:
```
Welcome to Ubuntu 22.04 LTS
root@your-server:~#
```

---

## Method 2: Command Prompt (CMD)

### Step 1: Open Command Prompt
1. Press `Windows Key + R`
2. Type `cmd` and press Enter
3. Or search for "Command Prompt" in Start menu

### Step 2: Connect via SSH
```cmd
ssh root@62.171.149.223
```

### Step 3-5: Same as PowerShell above

---

## Method 3: Windows Terminal (Modern Windows)

### Step 1: Open Windows Terminal
1. Press `Windows Key`
2. Search for "Windows Terminal"
3. Or press `Windows Key + X` and select "Terminal"

### Step 2: Connect
```bash
ssh root@62.171.149.223
```

---

## ⚠️ Troubleshooting

### Problem: "ssh is not recognized"
**Solution:** Install OpenSSH Client
1. Open **Settings** → **Apps** → **Optional Features**
2. Click **"Add a feature"**
3. Search for **"OpenSSH Client"**
4. Click **Install**
5. Restart PowerShell/CMD

### Problem: "Connection timed out"
**Solutions:**
- Check your internet connection
- Verify the IP address is correct: `62.171.149.223`
- Make sure your VPS is running
- Check if firewall is blocking port 22

### Problem: "Permission denied"
**Solutions:**
- Double-check the password: `B2e64X3kg9J`
- Make sure you're typing `root` (not `admin` or `user`)
- Password is case-sensitive

### Problem: Can't see password as you type
**This is normal!** For security, passwords don't show. Just type it and press Enter.

---

## 🔒 Security Reminder

After you connect, you should:
1. **Change the default password** (if this is the default)
2. **Set up SSH keys** (more secure than passwords)
3. **Configure firewall**

But first, let's get you connected! 🚀

---

## Quick Reference

**Command to connect:**
```bash
ssh root@62.171.149.223
```

**Password:**
```
B2e64X3kg9J
```

**What you'll see when connected:**
```
root@your-server:~#
```

This means you're logged in and ready to run commands!

