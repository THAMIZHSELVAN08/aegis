# -*- coding: utf-8 -*-
"""
mqtt_broker_bridge.py -- Lightweight Embedded MQTT Broker Bridge

Provides an in-process / standalone local MQTT 3.1.1 broker in pure Python
so the AEGIS streaming architecture runs out-of-the-box on localhost:1883
without requiring external Mosquitto or Docker setup.
"""

import socket
import threading
import struct
import sys
import io

# Force UTF-8 stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


class EmbeddedMQTTBroker:
    def __init__(self, host="127.0.0.1", port=1883):
        self.host = host
        self.port = port
        self.clients = set()
        self.subscriptions = {}  # topic -> set of client sockets
        self.lock = threading.Lock()
        self.running = False
        self.server_socket = None

    def start(self, daemon=True):
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            self.server_socket.bind((self.host, self.port))
            self.server_socket.listen(10)
            self.running = True
            print(f"[Embedded MQTT Broker] Listening on {self.host}:{self.port}", flush=True)

            t = threading.Thread(target=self._accept_loop, daemon=daemon)
            t.start()
            return t
        except Exception as err:
            print(
                f"[Embedded MQTT Broker] Could not bind {self.host}:{self.port} ({err}). "
                "Local broker may already be running.",
                flush=True,
            )
            return None

    def _accept_loop(self):
        while self.running:
            try:
                client_sock, addr = self.server_socket.accept()
                with self.lock:
                    self.clients.add(client_sock)
                t = threading.Thread(target=self._handle_client, args=(client_sock,), daemon=True)
                t.start()
            except Exception:
                if not self.running:
                    break

    def _read_bytes(self, sock, count):
        buf = bytearray()
        while len(buf) < count:
            chunk = sock.recv(count - len(buf))
            if not chunk:
                return None
            buf.extend(chunk)
        return bytes(buf)

    def _read_remaining_length(self, sock):
        multiplier = 1
        value = 0
        while True:
            b = self._read_bytes(sock, 1)
            if not b:
                return None
            digit = b[0]
            value += (digit & 127) * multiplier
            if (digit & 128) == 0:
                break
            multiplier *= 128
        return value

    def _handle_client(self, client_sock):
        try:
            while self.running:
                header = self._read_bytes(client_sock, 1)
                if not header:
                    break
                packet_type = header[0] >> 4
                rem_len = self._read_remaining_length(client_sock)
                if rem_len is None:
                    break
                payload = self._read_bytes(client_sock, rem_len) if rem_len > 0 else b""

                if packet_type == 1:  # CONNECT
                    # Send CONNACK (0x20 0x02 0x00 0x00)
                    client_sock.sendall(b"\x20\x02\x00\x00")

                elif packet_type == 3:  # PUBLISH
                    # Parse topic
                    topic_len = struct.unpack("!H", payload[:2])[0]
                    topic = payload[2:2 + topic_len].decode("utf-8", errors="ignore")
                    self._broadcast(topic, payload)

                elif packet_type == 8:  # SUBSCRIBE
                    msg_id = payload[:2]
                    idx = 2
                    sub_topics = []
                    while idx < len(payload):
                        t_len = struct.unpack("!H", payload[idx:idx + 2])[0]
                        t_name = payload[idx + 2:idx + 2 + t_len].decode("utf-8", errors="ignore")
                        sub_topics.append(t_name)
                        idx += 2 + t_len + 1  # topic name + qos byte

                    with self.lock:
                        for st in sub_topics:
                            if st not in self.subscriptions:
                                self.subscriptions[st] = set()
                            self.subscriptions[st].add(client_sock)

                    # Send SUBACK (0x90 0x03 msg_id 0x00)
                    suback = b"\x90\x03" + msg_id + b"\x00"
                    client_sock.sendall(suback)

                elif packet_type == 12:  # PINGREQ
                    # Send PINGRESP (0xd0 0x00)
                    client_sock.sendall(b"\xd0\x00")

                elif packet_type == 14:  # DISCONNECT
                    break

        except Exception:
            pass
        finally:
            self._cleanup_client(client_sock)

    def _broadcast(self, topic, raw_publish_packet):
        with self.lock:
            target_clients = set()
            for sub_topic, subscriber_set in self.subscriptions.items():
                # Simple exact match or '+' wildcard match
                if sub_topic == topic or self._topic_matches(sub_topic, topic):
                    target_clients.update(subscriber_set)

            # Reconstruct raw MQTT PUBLISH frame (0x30 + remaining_length + payload)
            rem_len = len(raw_publish_packet)
            header = bytearray([0x30])
            val = rem_len
            while True:
                digit = val % 128
                val //= 128
                if val > 0:
                    digit |= 0x80
                header.append(digit)
                if val == 0:
                    break

            packet = bytes(header) + raw_publish_packet

            dead_clients = set()
            for cs in target_clients:
                try:
                    cs.sendall(packet)
                except Exception:
                    dead_clients.add(cs)

            for dc in dead_clients:
                self._cleanup_client(dc)

    def _topic_matches(self, pattern, topic):
        p_parts = pattern.split("/")
        t_parts = topic.split("/")
        if len(p_parts) != len(t_parts):
            return False
        for p, t in zip(p_parts, t_parts):
            if p != "+" and p != t:
                return False
        return True

    def _cleanup_client(self, client_sock):
        with self.lock:
            self.clients.discard(client_sock)
            for sub_set in self.subscriptions.values():
                sub_set.discard(client_sock)
        try:
            client_sock.close()
        except Exception:
            pass


def run_broker():
    broker = EmbeddedMQTTBroker()
    broker.start(daemon=False)


if __name__ == "__main__":
    run_broker()
