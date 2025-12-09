# Asustor - Prometheus

Asustor APK package for Prometheus, open-source systems monitoring and alerting toolkit.

## Table of contents
1. [Installation](#installation)  
2. [Support & Sponsorship](#support)  
3. [License](#license)  
4. [Links](#links)  

## Installation <a name="installation"></a>

The APK application is available as a GitLab release, and on [https://asustor.cappysan.dev/](https://asustor.cappysan.dev/)

The APK application is not available as an Asustor App Central application as Asustor does not accept headless programs.

### Application Installation <a name="installation"></a>

**Step 1**

- Download the APK file from Cappysan's Asustor website ([https://asustor.cappysan.dev/2025/12/12/prometheus/](https://asustor.cappysan.dev/2025/12/12/prometheus/)  
- Enter the Asustor App Center from your Asustor NAS user interface  
- Enter the 'Management" tab in the App Center  
- Enter the "Manual Install" left tab from the "Management" tab  
- Select the previously downloaded file for the "Browse" input box  
- Click "Upload" and follow further instructions from pop-up box  

**Step 2**

In order to secure the newly created "Configuration" shared folder:

- Enter the "Access Control" tab in the App Center  
- Enter the "Shared folders" left tab from the "Access Control" tab  
- Select the "Configuration" folder to allow only the required users to modify the configuration  


### Configuration

By default, no configuration is required for Prometheus to operate.

The Prometheus HTTP interface is available on port 9090.

A HTTPS interface is preconfigured and available on port 9090 and replaces the HTTP interface.

You may also use the Cappysan Certbot and Apache packages to serve Prometheus over the standard HTTPS port (443) and disable the default Prometheus ports if desired.

Files within the `Configuration` shared folder can be modified via SSH or by exporting the shared folder through NFS, SMB, FTP, ...


## Support & Sponsorship <a name="support"></a>

You can help support this project, and all Cappysan projects, through the following actions:

- ⭐ Star the repository on GitLab, GitHub, or both to increase visibility and community engagement.

- 💬 Join the Discord community: [https://discord.gg/SsY3CAdp4Q](https://discord.gg/SsY3CAdp4Q) to connect, contribute, share feedback, and/or stay updated.

- 🛠️ Contribute by submitting issues, improving documentation, or creating pull requests to help the project grow.

- ☕ Support financially through [Buy Me a Coffee](https://buymeacoffee.com/cappysan), [Patreon](https://www.patreon.com/c/cappysan), [GitHub](https://github.com/sponsors/cappysan), or [Bitcoin (bc1qaz86l247df34h2q657c6zfs5l33r76s4ewxg4v)](https://addrs.to/pay/BTC/bc1qaz86l247df34h2q657c6zfs5l33r76s4ewxg4v). Your contributions directly sustain ongoing development and maintenance, including server costs.

Your support ensures these projects continue to improve, expand, and remain freely available to everyone.


## License <a name="license"></a>

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Please refer to the upstream software documentation for details on their respective licenses.


## Links <a name="links"></a>

  * Website: [https://asustor.cappysan.dev/](https://asustor.cappysan.dev/)
  * GitLab: [https://gitlab.com/cappysan/asustor/prometheus](https://gitlab.com/cappysan/asustor/prometheus)
  * GitHub: [https://github.com/cappysan/asustor-prometheus](https://github.com/cappysan/asustor-prometheus)
  * Discord: [https://discord.gg/SsY3CAdp4Q](https://discord.gg/SsY3CAdp4Q)
