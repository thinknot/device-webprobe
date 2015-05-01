#
echo
echo
echo Stop all constituent processes before doing this!
echo sudo /etc/init.d/sunspec_device-webprobe status
sudo /etc/init.d/sunspec_device-webprobe status
echo
echo
echo
echo Deploying the device-probe from here to /opt/sunspec/sunspec_devce-probe
echo
echo "sudo tar -cf - -C modsim . | tar -xpf - -C /opt/sunspec/device-webprobe/modsim"
sudo tar -cf - -C modsim . | tar -xpf - -C /opt/sunspec/device-webprobe/modsim
echo "sudo tar -cf - -C service . | tar -xpf - -C /opt/sunspec/device-webprobe/service"
sudo tar -cf - -C service . | tar -xpf - -C /opt/sunspec/device-webprobe/service
echo "sudo tar -cf - -C web-app . | tar -xpf - -C /opt/sunspec/device-webprobe/web-app"
sudo tar -cf - -C web-app . | tar -xpf - -C /opt/sunspec/device-webprobe/web-app
echo
echo
echo "sudo /etc/init.d/sunspec_device-webprobe start"
sudo /etc/init.d/sunspec_device-webprobe start