import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Modal, Alert, Vibration } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';

export default function App() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [countingDown, setCountingDown] = useState(false);
  const [timer, setTimer] = useState(10);
  const [subscription, setSubscription] = useState(null);

  // 1. Setup Crash Detection (Shaking the phone)
  const startMonitoring = () => {
    setIsMonitoring(true);
    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(data => {
      const totalForce = Math.sqrt(data.x**2 + data.y**2 + data.z**2);
      if (totalForce > 4.0) { // Detection threshold
        triggerAlert();
      }
    });
    setSubscription(sub);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (subscription) subscription.remove();
    setSubscription(null);
  };

  const triggerAlert = () => {
    if (!countingDown) {
      setCountingDown(true);
      setTimer(10);
      Vibration.vibrate([500, 500, 500]); // Alert the user physically
    }
  };

  // 2. Countdown logic
  useEffect(() => {
    let interval;
    if (countingDown && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      sendEmergencySOS();
      setCountingDown(false);
    }
    return () => clearInterval(interval);
  }, [countingDown, timer]);

  // 3. The "LifeLink" Core: SMS + GPS
  const sendEmergencySOS = async () => {
    // Get Location
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Error", "GPS Permission required");
      return;
    }
    
    let location = await Location.getCurrentPositionAsync({});
    const lat = location.coords.latitude;
    const lon = location.coords.longitude;
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

    // Send SMS
    const isSmsAvailable = await SMS.isAvailableAsync();
    if (isSmsAvailable) {
      await SMS.sendSMSAsync(
        ['9835304638', '8210002402', '8117011616', '8260986998', '7978245792', '8448463050'], // Emergency Contact Number
        `LIFELINK ALERT: Vehicle Accident Detected! Please contact : 9835304638 Location: ${mapLink}`
      );
    } else {
      Alert.alert("SOS SENT", `Coordinates: ${lat}, ${lon}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>LifeLink</Text>
      <Text style={styles.subtitle}>Mesh-Network SOS System</Text>

      <View style={styles.statusCircle}>
        <Text style={styles.statusText}>{isMonitoring ? "ACTIVE" : "OFFLINE"}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.mainBtn, isMonitoring ? styles.btnStop : styles.btnStart]} 
        onPress={isMonitoring ? stopMonitoring : startMonitoring}
      >
        <Text style={styles.btnLabel}>
          {isMonitoring ? "STOP MONITORING" : "START MONITORING"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.info}>If a crash is detected, an automatic SOS will be sent to your emergency contacts.</Text>

      {/* EMERGENCY OVERLAY */}
      <Modal visible={countingDown} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <Text style={styles.alertHeader}>ACCIDENT DETECTED</Text>
          <Text style={styles.timerText}>{timer}</Text>
          <Text style={styles.alertSub}>Initiating SOS in {timer}s...</Text>
          
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={() => {setCountingDown(false); setTimer(10);}}
          >
            <Text style={styles.cancelText}>I AM OKAY (CANCEL)</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 20 },
  logo: { fontSize: 48, fontWeight: '900', color: '#B91C1C' },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 40, letterSpacing: 1 },
  statusCircle: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWeight: 2, borderColor: '#E2E8F0', borderWidth: 1, marginBottom: 40 },
  statusText: { fontSize: 20, fontWeight: 'bold', color: '#94A3B8' },
  mainBtn: { width: '100%', padding: 20, borderRadius: 12, alignItems: 'center' },
  btnStart: { backgroundColor: '#1E293B' },
  btnStop: { backgroundColor: '#EF4444' },
  btnLabel: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  info: { marginTop: 20, textAlign: 'center', color: '#94A3B8', fontSize: 12 },
  modalBg: { flex: 1, backgroundColor: '#B91C1C', justifyContent: 'center', alignItems: 'center' },
  alertHeader: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  timerText: { color: '#FFF', fontSize: 120, fontWeight: '900' },
  alertSub: { color: '#FECACA', marginBottom: 40 },
  cancelBtn: { backgroundColor: '#FFF', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 8 },
  cancelText: { color: '#B91C1C', fontWeight: 'bold', fontSize: 16 }
});