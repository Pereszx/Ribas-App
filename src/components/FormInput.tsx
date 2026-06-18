import React from 'react';
import { TextInput, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  multiline?: boolean;
  numberOfLines?: number;
  showToggle?: boolean;
  showToggleState?: boolean;
  onToggle?: () => void;
  autoCorrect?: boolean;
}

export default function FormInput({
  label, placeholder, value, onChangeText,
  secureTextEntry, keyboardType, autoCapitalize,
  multiline, numberOfLines, showToggle,
  showToggleState, onToggle, autoCorrect
}: Props) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        <TextInput
          style={[styles.input, multiline && { height: (numberOfLines || 3) * 44, textAlignVertical: 'top' }]}
          placeholder={placeholder}
          placeholderTextColor="#aaa"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showToggleState}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'sentences'}
          autoCorrect={autoCorrect ?? false}
          multiline={multiline}
          numberOfLines={numberOfLines}
          scrollEnabled={multiline}
        />
        {showToggle && (
          <TouchableOpacity style={styles.eye} onPress={onToggle}>
            <Ionicons name={showToggleState ? 'eye-outline' : 'eye-off-outline'} size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { fontSize: 13, color: '#555', fontWeight: '500', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#f5f7ff',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  eye: {
    backgroundColor: '#f5f7ff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
});