# Realscan Device Setup Guide (Windows/WSL2)

## Step 1: Attach Device in Windows (PowerShell)

1. Open **PowerShell** as Administrator.
2. List all connected USB devices to find the Realscan device's Bus ID:
   ```powershell
   usbipd list
   ```
3. Attach the device to your WSL distribution (replace `<YOUR_BUSID>` with the actual Bus ID from the previous step):
   ```powershell
   usbipd attach --wsl --busid <YOUR_BUSID>
   ```

## Step 2: Configure Permissions in WSL (Ubuntu Terminal)

1. Open your **WSL (Ubuntu)** terminal.
2. Grant read/write permissions to the USB device (replace `<bus>` and `<device>` with the appropriate values, which can be found using `lsusb`):
   ```bash
   sudo chmod 666 /dev/bus/usb/<bus>/<device>
   ```

## Step 3: Run Realscan Agent (Docker)

1. Run the Realscan Agent Docker container with the necessary privileges and volume mapping:
   ```bash
   sudo docker run -d \
     --rm \
     --name realscan-agent \
     --privileged \
     -v /dev/bus/usb:/dev/bus/usb \
     -p 8010:18010 \
     realscan_agent:1.0.4
   ```

## Step 4: Run the Application

Once the agent is running, you can start the biometric enrollment/verification application. The application will communicate with the agent on port `8010`.

## Step 5: Open the Application

Open the application
run "npm run dev" and click on "localhost:3000"


## Step 6
 click on the "Enroll" button to start the enrollment process. Start button must be pressed for the device to scan

---
**Note:** If you unplug the device or restart Windows, you may need to repeat the `usbipd attach` step.
