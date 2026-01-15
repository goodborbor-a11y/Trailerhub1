# 📤 Upload Project Files to VPS

## Method: Using SCP from Windows PowerShell

### Step 1: Open PowerShell on Windows
- Press `Windows Key + X`
- Click "Windows PowerShell" or "Terminal"
- Make sure you're NOT in the SSH session (open a NEW PowerShell window)

### Step 2: Navigate to your project folder
```powershell
cd C:\trailerhub1
```

### Step 3: Upload files to VPS
```powershell
scp -r * root@62.171.149.223:/root/trailerhub/
```

**What this does:**
- `scp` = secure copy (file transfer)
- `-r` = recursive (all files and folders)
- `*` = everything in current folder
- `root@62.171.149.223` = your VPS
- `/root/trailerhub/` = destination folder

### Step 4: Enter password when prompted
When asked for password, type:
```
B2e64X3kg9J
```
(Password won't show as you type)

### Step 5: Wait for upload
This may take a few minutes depending on file size.

---

## Alternative: Upload specific folders only

If you want to upload only essential files:

```powershell
# Upload docker-compose.yml
scp docker-compose.yml root@62.171.149.223:/root/trailerhub/

# Upload Dockerfile
scp Dockerfile root@62.171.149.223:/root/trailerhub/

# Upload server folder
scp -r server root@62.171.149.223:/root/trailerhub/

# Upload src folder
scp -r src root@62.171.149.223:/root/trailerhub/

# Upload database folder
scp -r database root@62.171.149.223:/root/trailerhub/

# Upload package.json files
scp package.json root@62.171.149.223:/root/trailerhub/
scp server/package.json root@62.171.149.223:/root/trailerhub/server/
```

---

## After Upload: Verify on VPS

SSH into your VPS and check:

```bash
ssh root@62.171.149.223
cd /root/trailerhub
ls -la
```

You should see your project files!

