// Script para crear una identidad de usuario en localStorage
// Ejecutar este script en la consola del navegador

(function createUserIdentity() {
  console.log('🔧 Creando identidad de usuario...');
  
  // Generar identidad
  const userIdentity = {
    id: crypto.randomUUID(),
    nodeId: `NODE_${Math.floor(Math.random() * 90000) + 10000}`,
    publicKey: 'test-public-key-' + Math.random().toString(36).substring(7),
    avatar: 'default-avatar',
    createdAt: Date.now(),
    lastActive: Date.now()
  };
  
  // Generar access code y salt
  const accessCode = 'access-code-' + Math.random().toString(36).substring(7);
  const salt = 'salt-' + Math.random().toString(36).substring(7);
  
  // Guardar en localStorage
  localStorage.setItem('dropnet_identity', JSON.stringify(userIdentity));
  localStorage.setItem('dropnet_access_code', accessCode);
  localStorage.setItem('dropnet_salt', salt);
  
  // Mostrar información
  console.log('✅ Identidad creada exitosamente!');
  console.log('📋 Detalles:');
  console.log('  ID:', userIdentity.id);
  console.log('  Node ID:', userIdentity.nodeId);
  console.log('  Short ID:', userIdentity.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase());
  console.log('  Access Code:', accessCode);
  console.log('  Salt:', salt);
  
  // Verificar que se guardó
  const saved = localStorage.getItem('dropnet_identity');
  if (saved) {
    console.log('✅ Identidad guardada correctamente en localStorage');
    console.log('🔄 Recarga la página para ver los cambios');
  } else {
    console.error('❌ Error al guardar la identidad');
  }
})();