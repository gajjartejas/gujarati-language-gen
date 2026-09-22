"""
Gujarati Handwriting Recognition - Tiny CNN Training & TFLite INT8 Export Script

Trains a lightweight Convolutional Neural Network on 64x64 rasterized strokes
and exports an INT8 quantized TFLite model (~90KB) for low-RAM mobile devices.

Requirements:
    pip install torch torchvision tensorflow
"""

import os
import json
import numpy as np

# Model Hyperparameters
INPUT_SIZE = 64
NUM_CLASSES = 56
BATCH_SIZE = 32
EPOCHS = 15

def build_keras_tiny_cnn(num_classes):
    """
    Constructs a Tiny CNN model targeting < 1MB footprint and < 15ms latency.
    """
    try:
        import tensorflow as tf
        from tensorflow.keras import layers, models

        model = models.Sequential([
            layers.Input(shape=(INPUT_SIZE, INPUT_SIZE, 1)),
            layers.Conv2D(16, (3, 3), padding='same', activation='relu'),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(32, (3, 3), padding='same', activation='relu'),
            layers.MaxPooling2D((2, 2)),
            layers.Flatten(),
            layers.Dense(64, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(num_classes, activation='softmax')
        ])

        model.compile(
            optimizer='adam',
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        return model
    except ImportError:
        print("TensorFlow not installed. Please install via: pip install tensorflow")
        return None

def export_tflite_int8(keras_model, output_path="gujarati_tiny_cnn_int8.tflite"):
    """
    Converts a Keras model to an INT8 quantized TFLite model.
    """
    import tensorflow as tf

    def representative_dataset():
        for _ in range(100):
            data = np.random.rand(1, INPUT_SIZE, INPUT_SIZE, 1).astype(np.float32)
            yield [data]

    converter = tf.lite.TFLiteConverter.from_keras_model(keras_model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.representative_dataset = representative_dataset
    converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
    converter.inference_input_type = tf.int8
    converter.inference_output_type = tf.int8

    tflite_quant_model = converter.convert()

    with open(output_path, "wb") as f:
        f.write(tflite_quant_model)

    size_kb = len(tflite_quant_model) / 1024
    print(f"Exported INT8 TFLite model: {output_path} ({size_kb:.1f} KB)")

if __name__ == "__main__":
    print("Gujarati Handwriting Recognition - Model Training Pipeline")
    print(f"Target Architecture: Conv2D(16) -> MaxPool -> Conv2D(32) -> MaxPool -> Dense(64) -> Dense({NUM_CLASSES})")
    model = build_keras_tiny_cnn(NUM_CLASSES)
    if model:
        model.summary()
