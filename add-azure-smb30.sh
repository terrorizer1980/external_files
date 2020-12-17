#!/bin/bash
# bash /tmp/add-azure-smb30.sh "ResouceGroup" "StorageAccount" "fileshare"
if ! command -v az &> /dev/null;then
    echo "Install azure az"
    exit 1
fi
if ! command -v mount.cifs &> /dev/null;then
    sudo apt install cifs-utils -y
fi
resourceGroupName="${1}"
storageAccountName="${2}"
fileShareName="${3}"
more_option="gid=$EUID,uid=$EUID,file_mode=0775,dir_mode=0775"

httpEndpoint=$(az storage account show --resource-group $resourceGroupName --name $storageAccountName --query "primaryEndpoints.file" | tr -d '"')
smbPath=$(echo $httpEndpoint | cut -c7-$(expr length $httpEndpoint))$fileShareName
storageAccountKey=$(az storage account keys list --resource-group $resourceGroupName --account-name $storageAccountName --query "[0].value" | tr -d '"')
mntPath="/mnt/$storageAccountName/$fileShareName"
fileHost=$(echo $smbPath | tr -d "/")
echo "$httpEndpoint, 
$mntPath, 
$mntPath, 
$storageAccountKey"

sudo umount $mntPath

sudo mkdir -p $mntPath
sudo mount.cifs $smbPath $mntPath -o vers=3.0,username=$storageAccountName,password=$storageAccountKey,serverino,$more_option
if [ ! -d "/etc/smbcredentials" ]; then
    sudo mkdir "/etc/smbcredentials"
fi
smbCredentialFile="/etc/smbcredentials/$storageAccountName.cred"
if [ ! -f $smbCredentialFile ]; then
    echo "username=$storageAccountName" | sudo tee $smbCredentialFile > /dev/null
    echo "password=$storageAccountKey" | sudo tee -a $smbCredentialFile > /dev/null
else 
    echo "The credential file $smbCredentialFile already exists, and was not modified."
fi
sudo chmod 600 $smbCredentialFile
if [ -z "$(grep $smbPath\ $mntPath /etc/fstab)" ]; then
    echo "$smbPath $mntPath cifs nofail,vers=3.0,credentials=$smbCredentialFile,serverino,$more_option 0 $((1 + $(cat /etc/fstab|awk '{print $6}'|tail -1)))" | sudo tee -a /etc/fstab > /dev/null
else
    echo "/etc/fstab was not modified to avoid conflicting entries as this Azure file share was already present. You may want to double check /etc/fstab to ensure the configuration is as desired."
fi

sudo mount -a