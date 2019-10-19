function login(files, fileLoadCallback) {
  var reader = new FileReader();

  reader.onload = fileLoadCallback;

  reader.readAsText(files[0]);
}
