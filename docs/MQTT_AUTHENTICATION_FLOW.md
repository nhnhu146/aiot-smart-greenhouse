# MQTT Authentication Flow Documentation

## Overview

The MQTT authentication system has been updated to follow a secure initialization flow:

1. **Start with anonymous access** (temporary)
2. **Create default user credentials** 
3. **Switch to secure authentication**
4. **Disable anonymous access**

## Configuration Files

### `mosquitto-anonymous.conf`
- Temporary configuration allowing anonymous access
- Used during initial setup and user creation
- **Security**: `allow_anonymous true`

### `mosquitto-secure.conf` 
- Production configuration requiring authentication
- Used after user credentials are created
- **Security**: `allow_anonymous false` + `password_file`

### `mosquitto.conf`
- Active configuration (gets copied from templates)
- Changes during the setup process

## Scripts Involved

### `init-mqtt.ps1`
- Initializes MQTT with anonymous configuration
- Creates configuration templates if missing
- Sets up initial state for authentication flow

### `setup-mqtt-user.ps1`
- **Step 1**: Ensures anonymous configuration is active
- **Step 2**: Starts MQTT with anonymous access
- **Step 3**: Creates user "vision" with password "vision"
- **Step 4**: Sets proper file permissions
- **Step 5**: Switches to secure configuration
- **Step 6**: Restarts MQTT with authentication enabled
- **Step 7**: Tests authentication and verifies anonymous access is disabled

### `start-dev.ps1` & `start-prod.ps1`
- Call `init-mqtt.ps1` to prepare configuration
- Start Docker services
- Call `setup-mqtt-user.ps1` to configure authentication
- Proceed with application startup

## Authentication Flow

```
1. [Anonymous Config] → MQTT starts allowing any connection
2. [Create User] → Add "vision:vision" to password file  
3. [Secure Config] → Switch to require authentication
4. [Restart MQTT] → Apply new configuration
5. [Test Auth] → Verify authentication works
6. [Verify Security] → Confirm anonymous access blocked
```

## Default Credentials

- **Username**: `vision`
- **Password**: `vision`
- **File**: `/mosquitto/config/passwd` (inside container)

## Security Features

### ✅ Enabled Security
- Username/password authentication required
- Anonymous access disabled after setup
- Password file with proper permissions (600)
- Connection testing and verification

### 🔧 Configuration Options
- Customizable username/password via script parameters
- Separate dev/prod configurations
- Health checks adapted for authentication flow
- Graceful fallback if setup fails

## Usage

### Development
```powershell
.\scripts\start-dev.ps1
```
This will:
1. Initialize MQTT with anonymous access
2. Start services
3. Create "vision" user automatically
4. Switch to secure authentication

### Production
```powershell
.\scripts\start-prod.ps1 -MqttUser "production_user" -MqttPassword "secure_password"
```
This will:
1. Initialize MQTT with anonymous access
2. Start production services
3. Create custom user credentials
4. Switch to secure authentication
5. Fail if authentication setup unsuccessful

### Manual MQTT Setup
```powershell
.\scripts\setup-mqtt-user.ps1 -Username "custom_user" -Password "custom_pass" -Verbose
```

## Troubleshooting

### If Authentication Setup Fails
1. Check Docker containers are running: `docker ps`
2. Check MQTT logs: `docker logs aiot_greenhouse_mqtt`
3. Verify configuration files exist in `mosquitto/config/`
4. Try manual setup: `.\scripts\setup-mqtt-user.ps1 -Verbose`

### If Anonymous Access Still Works
- Authentication setup may have failed
- Check that `mosquitto.conf` contains `allow_anonymous false`
- Verify password file exists and has correct permissions
- Restart MQTT container: `docker restart aiot_greenhouse_mqtt`

### For Development Issues
- Use `start-dev.ps1` which has fallback options
- Check that MQTT broker is accessible on localhost:1883
- Verify backend can connect with vision:vision credentials

## Migration from Old System

If upgrading from the previous system:
1. Remove old `mosquitto-temp.conf` files
2. Run `.\scripts\clean-project.ps1` to clear cache
3. Use `.\scripts\start-dev.ps1` for automatic setup
4. Update any hardcoded MQTT configurations to use "vision:vision"
